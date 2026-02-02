"""
Admin API Routes
Dashboard analytics, officer management, and system administration
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func, text
from app import db, bcrypt
from app.models.models import Complaint, User, StatusUpdate, Department

admin_bp = Blueprint('admin', __name__)


def admin_required(fn):
    """Decorator to require admin role"""
    from functools import wraps
    
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'message': 'Admin access required'}), 403
        return fn(*args, **kwargs)
    
    return wrapper


@admin_bp.route('/dashboard', methods=['GET'])
@admin_required
def get_dashboard():
    """
    Get admin dashboard overview
    """
    today = datetime.utcnow().date()
    week_ago = today - timedelta(days=7)
    month_ago = today - timedelta(days=30)
    
    # Total complaints
    total_complaints = Complaint.query.count()
    
    # Status breakdown
    status_counts = db.session.query(
        Complaint.status,
        func.count(Complaint.id)
    ).group_by(Complaint.status).all()
    
    # Category breakdown
    category_counts = db.session.query(
        Complaint.category,
        func.count(Complaint.id)
    ).group_by(Complaint.category).all()
    
    # Priority breakdown
    priority_counts = db.session.query(
        Complaint.priority,
        func.count(Complaint.id)
    ).group_by(Complaint.priority).all()
    
    # Today's complaints
    today_complaints = Complaint.query.filter(
        func.date(Complaint.created_at) == today
    ).count()
    
    # This week's complaints
    week_complaints = Complaint.query.filter(
        Complaint.created_at >= week_ago
    ).count()
    
    # Average resolution time (in hours)
    avg_resolution = db.session.query(
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        )
    ).filter(Complaint.resolved_at.isnot(None)).scalar() or 0
    
    # Critical issues count
    critical_count = Complaint.query.filter(
        Complaint.priority == 'critical',
        Complaint.status.in_(['pending', 'in_progress'])
    ).count()
    
    # Pending escalations
    escalation_threshold = datetime.utcnow() - timedelta(hours=48)
    pending_escalations = Complaint.query.filter(
        Complaint.status == 'pending',
        Complaint.created_at < escalation_threshold
    ).count()
    
    return jsonify({
        'overview': {
            'total_complaints': total_complaints,
            'today_complaints': today_complaints,
            'week_complaints': week_complaints,
            'critical_issues': critical_count,
            'pending_escalations': pending_escalations,
            'avg_resolution_hours': round(avg_resolution, 2)
        },
        'status_breakdown': dict(status_counts),
        'category_breakdown': dict(category_counts),
        'priority_breakdown': dict(priority_counts)
    }), 200


@admin_bp.route('/users', methods=['GET'])
@admin_required
def get_users():
    """
    Get all users with filters
    """
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    role = request.args.get('role')
    search = request.args.get('search')
    
    query = User.query
    
    if role:
        query = query.filter_by(role=role)
    
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (User.email.ilike(search_term)) |
            (User.first_name.ilike(search_term)) |
            (User.last_name.ilike(search_term))
        )
    
    query = query.order_by(User.created_at.desc())
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'users': [u.to_dict() for u in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@admin_bp.route('/users', methods=['POST'])
@admin_required
def create_user():
    """
    Create a new user (officer or admin)
    """
    data = request.get_json()
    
    required_fields = ['email', 'password', 'first_name', 'last_name', 'role']
    for field in required_fields:
        if field not in data:
            return jsonify({'message': f'{field} is required'}), 400
    
    if data['role'] not in ['citizen', 'officer', 'admin']:
        return jsonify({'message': 'Invalid role'}), 400
    
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already exists'}), 409
    
    password_hash = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    
    user = User(
        email=data['email'],
        password_hash=password_hash,
        first_name=data['first_name'],
        last_name=data['last_name'],
        phone=data.get('phone'),
        role=data['role'],
        department=data.get('department')
    )
    
    db.session.add(user)
    db.session.commit()
    
    return jsonify({'message': 'User created', 'user': user.to_dict()}), 201


@admin_bp.route('/users/<int:user_id>', methods=['PUT'])
@admin_required
def update_user(user_id):
    """
    Update user details
    """
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    data = request.get_json()
    
    if 'first_name' in data:
        user.first_name = data['first_name']
    if 'last_name' in data:
        user.last_name = data['last_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'role' in data and data['role'] in ['citizen', 'officer', 'admin']:
        user.role = data['role']
    if 'department' in data:
        user.department = data['department']
    if 'is_active' in data:
        user.is_active = data['is_active']
    
    db.session.commit()
    
    return jsonify({'message': 'User updated', 'user': user.to_dict()}), 200


@admin_bp.route('/users/<int:user_id>', methods=['DELETE'])
@admin_required
def deactivate_user(user_id):
    """
    Deactivate a user (soft delete)
    """
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'message': 'User not found'}), 404
    
    user.is_active = False
    db.session.commit()
    
    return jsonify({'message': 'User deactivated'}), 200


@admin_bp.route('/officers', methods=['GET'])
@admin_required
def get_officers():
    """
    Get all officers with their workload
    """
    officers = User.query.filter_by(role='officer', is_active=True).all()
    
    result = []
    for officer in officers:
        assigned_count = Complaint.query.filter_by(officer_id=officer.id).count()
        pending_count = Complaint.query.filter_by(
            officer_id=officer.id,
            status='in_progress'
        ).count()
        resolved_count = Complaint.query.filter_by(
            officer_id=officer.id,
            status='resolved'
        ).count()
        
        data = officer.to_dict()
        data['workload'] = {
            'assigned': assigned_count,
            'pending': pending_count,
            'resolved': resolved_count
        }
        result.append(data)
    
    return jsonify({'officers': result}), 200


@admin_bp.route('/departments', methods=['GET'])
@admin_required
def get_departments():
    """
    Get all departments with stats
    """
    departments = Department.query.filter_by(is_active=True).all()
    
    result = []
    for dept in departments:
        complaint_count = Complaint.query.filter_by(department=dept.name).count()
        pending_count = Complaint.query.filter_by(
            department=dept.name,
            status='pending'
        ).count()
        
        data = dept.to_dict()
        data['stats'] = {
            'total_complaints': complaint_count,
            'pending': pending_count
        }
        result.append(data)
    
    return jsonify({'departments': result}), 200


@admin_bp.route('/departments', methods=['POST'])
@admin_required
def create_department():
    """
    Create a new department
    """
    data = request.get_json()
    
    if not data.get('name') or not data.get('code'):
        return jsonify({'message': 'Name and code are required'}), 400
    
    if Department.query.filter_by(code=data['code']).first():
        return jsonify({'message': 'Department code already exists'}), 409
    
    dept = Department(
        name=data['name'],
        code=data['code'],
        categories=data.get('categories', [])
    )
    
    db.session.add(dept)
    db.session.commit()
    
    return jsonify({'message': 'Department created', 'department': dept.to_dict()}), 201


@admin_bp.route('/heatmap', methods=['GET'])
@admin_required
def get_heatmap_data():
    """
    Get complaint heatmap data for visualization
    """
    category = request.args.get('category')
    days = request.args.get('days', 30, type=int)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = Complaint.query.filter(Complaint.created_at >= start_date)
    
    if category:
        query = query.filter_by(category=category)
    
    complaints = query.all()
    
    heatmap_data = [
        {
            'lat': c.latitude,
            'lng': c.longitude,
            'intensity': c.severity_score,
            'category': c.category,
            'status': c.status
        }
        for c in complaints
    ]
    
    return jsonify({'heatmap': heatmap_data}), 200


@admin_bp.route('/bulk-assign', methods=['POST'])
@admin_required
def bulk_assign():
    """
    Bulk assign complaints to officers
    """
    data = request.get_json()
    complaint_ids = data.get('complaint_ids', [])
    officer_id = data.get('officer_id')
    
    if not complaint_ids or not officer_id:
        return jsonify({'message': 'Complaint IDs and officer ID required'}), 400
    
    officer = User.query.filter_by(id=officer_id, role='officer').first()
    if not officer:
        return jsonify({'message': 'Officer not found'}), 404
    
    updated = 0
    for cid in complaint_ids:
        complaint = Complaint.query.filter_by(complaint_id=cid).first()
        if complaint:
            complaint.officer_id = officer_id
            if complaint.status == 'pending':
                complaint.status = 'in_progress'
            updated += 1
    
    db.session.commit()
    
    return jsonify({'message': f'{updated} complaints assigned'}), 200
