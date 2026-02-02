"""
Officer API Routes
Endpoints for field officers to manage assigned complaints
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from sqlalchemy import func
from app import db
from app.models.models import Complaint, User, StatusUpdate

officer_bp = Blueprint('officer', __name__)


def officer_required(fn):
    """Decorator to require officer or admin role"""
    from functools import wraps
    
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') not in ['officer', 'admin']:
            return jsonify({'message': 'Officer access required'}), 403
        return fn(*args, **kwargs)
    
    return wrapper


@officer_bp.route('/dashboard', methods=['GET'])
@officer_required
def get_officer_dashboard():
    """
    Get officer's personal dashboard
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    # My assigned complaints
    my_complaints = Complaint.query.filter_by(officer_id=current_user_id)
    
    total_assigned = my_complaints.count()
    pending = my_complaints.filter_by(status='in_progress').count()
    resolved_today = my_complaints.filter(
        Complaint.status == 'resolved',
        func.date(Complaint.resolved_at) == datetime.utcnow().date()
    ).count()
    resolved_this_week = my_complaints.filter(
        Complaint.status == 'resolved',
        Complaint.resolved_at >= datetime.utcnow() - timedelta(days=7)
    ).count()
    
    # Critical issues
    critical = my_complaints.filter(
        Complaint.priority == 'critical',
        Complaint.status != 'resolved'
    ).count()
    
    # Average resolution time (in hours)
    avg_resolution = db.session.query(
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        )
    ).filter(
        Complaint.officer_id == current_user_id,
        Complaint.resolved_at.isnot(None)
    ).scalar() or 0
    
    return jsonify({
        'officer': user.to_dict() if user else None,
        'stats': {
            'total_assigned': total_assigned,
            'pending': pending,
            'resolved_today': resolved_today,
            'resolved_this_week': resolved_this_week,
            'critical_issues': critical,
            'avg_resolution_hours': round(avg_resolution, 2)
        }
    }), 200


@officer_bp.route('/complaints', methods=['GET'])
@officer_required
def get_my_complaints():
    """
    Get complaints assigned to current officer
    """
    current_user_id = int(get_jwt_identity())
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    priority = request.args.get('priority')
    
    query = Complaint.query.filter_by(officer_id=current_user_id)
    
    if status:
        query = query.filter_by(status=status)
    if priority:
        query = query.filter_by(priority=priority)
    
    # Sort by priority (critical first) and date
    query = query.order_by(
        Complaint.severity_score.desc(),
        Complaint.created_at.desc()
    )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'complaints': [c.to_dict() for c in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@officer_bp.route('/complaints/<string:complaint_id>/update', methods=['POST'])
@officer_required
def update_my_complaint(complaint_id):
    """
    Update status of an assigned complaint
    """
    current_user_id = int(get_jwt_identity())
    
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    # Check if complaint is assigned to this officer
    if complaint.officer_id != current_user_id:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'message': 'This complaint is not assigned to you'}), 403
    
    data = request.get_json()
    new_status = data.get('status')
    comment = data.get('comment', '')
    
    valid_statuses = ['in_progress', 'resolved', 'closed']
    if new_status and new_status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Officers can set: {valid_statuses}'}), 400
    
    # Create status update
    if new_status:
        status_update = StatusUpdate(
            complaint=complaint,
            user_id=current_user_id,
            previous_status=complaint.status,
            new_status=new_status,
            comment=comment
        )
        complaint.status = new_status
        
        if new_status == 'resolved':
            complaint.resolved_at = datetime.utcnow()
        
        db.session.add(status_update)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Complaint updated',
        'complaint': complaint.to_dict(include_updates=True)
    }), 200


@officer_bp.route('/complaints/<string:complaint_id>/notes', methods=['POST'])
@officer_required
def add_note(complaint_id):
    """
    Add a note/comment to a complaint
    """
    current_user_id = int(get_jwt_identity())
    
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    if complaint.officer_id != current_user_id:
        claims = get_jwt()
        if claims.get('role') != 'admin':
            return jsonify({'message': 'Not authorized'}), 403
    
    data = request.get_json()
    comment = data.get('comment', '').strip()
    
    if not comment:
        return jsonify({'message': 'Comment is required'}), 400
    
    # Create status update as a note (same status)
    status_update = StatusUpdate(
        complaint=complaint,
        user_id=current_user_id,
        previous_status=complaint.status,
        new_status=complaint.status,
        comment=comment
    )
    
    db.session.add(status_update)
    db.session.commit()
    
    return jsonify({
        'message': 'Note added',
        'update': status_update.to_dict()
    }), 201


@officer_bp.route('/department-complaints', methods=['GET'])
@officer_required
def get_department_complaints():
    """
    Get all complaints for officer's department (unassigned or assigned to others)
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    if not user or not user.department:
        return jsonify({'message': 'No department assigned'}), 400
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    unassigned_only = request.args.get('unassigned', 'false').lower() == 'true'
    
    query = Complaint.query.filter_by(department=user.department)
    
    if unassigned_only:
        query = query.filter(Complaint.officer_id.is_(None))
    
    query = query.order_by(
        Complaint.severity_score.desc(),
        Complaint.created_at.desc()
    )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'complaints': [c.to_dict() for c in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@officer_bp.route('/claim/<string:complaint_id>', methods=['POST'])
@officer_required
def claim_complaint(complaint_id):
    """
    Officer claims an unassigned complaint
    """
    current_user_id = int(get_jwt_identity())
    user = User.query.get(current_user_id)
    
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    if complaint.officer_id:
        return jsonify({'message': 'Complaint is already assigned'}), 400
    
    # Verify department match
    if user.department and complaint.department != user.department:
        return jsonify({'message': 'Cannot claim complaints from other departments'}), 403
    
    complaint.officer_id = current_user_id
    complaint.status = 'in_progress'
    
    # Log the assignment
    status_update = StatusUpdate(
        complaint=complaint,
        user_id=current_user_id,
        previous_status='pending',
        new_status='in_progress',
        comment='Claimed by officer'
    )
    
    db.session.add(status_update)
    db.session.commit()
    
    return jsonify({
        'message': 'Complaint claimed successfully',
        'complaint': complaint.to_dict()
    }), 200


@officer_bp.route('/performance', methods=['GET'])
@officer_required
def get_my_performance():
    """
    Get officer's performance metrics
    """
    current_user_id = int(get_jwt_identity())
    days = request.args.get('days', 30, type=int)
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Resolution stats
    resolved = Complaint.query.filter(
        Complaint.officer_id == current_user_id,
        Complaint.resolved_at >= start_date
    ).count()
    
    # Category breakdown
    category_stats = db.session.query(
        Complaint.category,
        func.count(Complaint.id)
    ).filter(
        Complaint.officer_id == current_user_id,
        Complaint.resolved_at >= start_date
    ).group_by(Complaint.category).all()
    
    # Daily resolutions
    daily_stats = db.session.query(
        func.date(Complaint.resolved_at).label('date'),
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.officer_id == current_user_id,
        Complaint.resolved_at >= start_date
    ).group_by(func.date(Complaint.resolved_at)).all()
    
    return jsonify({
        'period_days': days,
        'total_resolved': resolved,
        'by_category': dict(category_stats),
        'daily_resolutions': [
            {'date': str(d.date), 'count': d.count}
            for d in daily_stats
        ]
    }), 200
