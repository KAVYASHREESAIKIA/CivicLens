"""
Complaints API Routes
Handles complaint submission, tracking, and updates
"""
import os
import uuid
from datetime import datetime
from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, get_jwt
from werkzeug.utils import secure_filename
from marshmallow import Schema, fields, validate, ValidationError
from sqlalchemy import func, text
from app import db
from app.models.models import Complaint, StatusUpdate, User
from app.services.ai_service import AIService
from app.services.complaint_service import ComplaintService

complaints_bp = Blueprint('complaints', __name__)
ai_service = AIService()
complaint_service = ComplaintService()


# Validation Schemas
class ComplaintSchema(Schema):
    title = fields.Str(load_default="Untitled Complaint", validate=validate.Length(min=0, max=200))
    description = fields.Str(load_default="No description provided", validate=validate.Length(min=0, max=5000))
    category = fields.Str(validate=validate.OneOf([
        'roads', 'water', 'sanitation', 'safety', 'electricity',
        'public_transport', 'environment', 'other'
    ]))
    latitude = fields.Float(load_default=0.0, validate=validate.Range(min=-90, max=90))
    longitude = fields.Float(load_default=0.0, validate=validate.Range(min=-180, max=180))
    address = fields.Str(validate=validate.Length(max=500))
    ward = fields.Str(validate=validate.Length(max=100))
    zone = fields.Str(validate=validate.Length(max=100))


def allowed_file(filename):
    """Check if file extension is allowed"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in current_app.config['ALLOWED_EXTENSIONS']


def generate_complaint_id():
    """Generate unique complaint ID: CL-YYYY-XXXXXX"""
    year = datetime.utcnow().year
    count = Complaint.query.filter(
        func.extract('year', Complaint.created_at) == year
    ).count() + 1
    return f"CL-{year}-{count:06d}"


@complaints_bp.route('', methods=['POST'])
@jwt_required()
def create_complaint():
    """
    Create a new complaint
    """
    current_user_id = int(get_jwt_identity())
    
    # Validate JSON data
    from marshmallow import INCLUDE
    try:
        data = ComplaintSchema().load(request.form.to_dict(), unknown=INCLUDE)
    except ValidationError as err:
        print(f"Validation Error: {err.messages}")
        return jsonify({'message': 'Validation error', 'errors': err.messages}), 400
    
    # Handle image upload
    image_url = None
    if 'image' in request.files:
        file = request.files['image']
        if file and file.filename and allowed_file(file.filename):
            filename = f"{uuid.uuid4().hex}_{secure_filename(file.filename)}"
            filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
            file.save(filepath)
            image_url = f"/uploads/{filename}"
    
    # AI processing - categorize and calculate severity
    ai_result = ai_service.process_complaint(
        text=data['description'],
        category=data.get('category'),
        latitude=data['latitude'],
        longitude=data['longitude']
    )
    
    # Create complaint
    complaint = Complaint(
        complaint_id=generate_complaint_id(),
        user_id=current_user_id,
        title=data['title'],
        description=data['description'],
        category=data.get('category') or ai_result['category'],
        ai_category=ai_result['category'],
        category_confidence=ai_result['confidence'],
        latitude=data['latitude'],
        longitude=data['longitude'],
        location=f"POINT({data['longitude']} {data['latitude']})",
        address=data.get('address'),
        ward=data.get('ward'),
        zone=data.get('zone'),
        image_url=image_url,
        severity_score=ai_result['severity_score'],
        priority=ai_result['priority'],
        department=complaint_service.get_department_for_category(ai_result['category'])
    )
    
    db.session.add(complaint)
    
    # Create initial status update
    status_update = StatusUpdate(
        complaint=complaint,
        user_id=current_user_id,
        new_status='pending',
        comment='Complaint submitted'
    )
    db.session.add(status_update)
    
    db.session.commit()
    
    return jsonify({
        'message': 'Complaint submitted successfully',
        'complaint': complaint.to_dict(include_updates=True)
    }), 201


@complaints_bp.route('', methods=['GET'])
@jwt_required()
def get_complaints():
    """
    Get complaints for current user or all (for admin/officer)
    """
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    category = request.args.get('category')
    priority = request.args.get('priority')
    
    query = Complaint.query
    
    # Role-based filtering
    if role == 'citizen':
        query = query.filter_by(user_id=current_user_id)
    elif role == 'officer':
        user = User.query.get(current_user_id)
        if user and user.department:
            query = query.filter_by(department=user.department)
    
    # Apply filters
    if status:
        query = query.filter_by(status=status)
    if category:
        query = query.filter_by(category=category)
    if priority:
        query = query.filter_by(priority=priority)
    
    # Order by priority and creation date
    query = query.order_by(
        Complaint.severity_score.desc(),
        Complaint.created_at.desc()
    )
    
    pagination = query.paginate(page=page, per_page=per_page, error_out=False)
    
    return jsonify({
        'complaints': [c.to_dict() for c in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'per_page': per_page
    }), 200


@complaints_bp.route('/<string:complaint_id>', methods=['GET'])
@jwt_required()
def get_complaint(complaint_id):
    """
    Get a single complaint by ID
    """
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    # Access control
    if role == 'citizen' and complaint.user_id != current_user_id:
        return jsonify({'message': 'Access denied'}), 403
    
    return jsonify({'complaint': complaint.to_dict(include_updates=True)}), 200


@complaints_bp.route('/<string:complaint_id>/status', methods=['PUT'])
@jwt_required()
def update_complaint_status(complaint_id):
    """
    Update complaint status (officers/admin only)
    """
    current_user_id = int(get_jwt_identity())
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    if role == 'citizen':
        return jsonify({'message': 'Access denied'}), 403
    
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    data = request.get_json()
    new_status = data.get('status')
    comment = data.get('comment', '')
    
    valid_statuses = ['pending', 'in_progress', 'resolved', 'closed', 'rejected']
    if new_status not in valid_statuses:
        return jsonify({'message': f'Invalid status. Must be one of: {valid_statuses}'}), 400
    
    # Create status update
    status_update = StatusUpdate(
        complaint=complaint,
        user_id=current_user_id,
        previous_status=complaint.status,
        new_status=new_status,
        comment=comment
    )
    
    # Update complaint
    complaint.status = new_status
    if new_status == 'resolved':
        complaint.resolved_at = datetime.utcnow()
    
    db.session.add(status_update)
    db.session.commit()
    
    return jsonify({
        'message': 'Status updated',
        'complaint': complaint.to_dict(include_updates=True)
    }), 200


@complaints_bp.route('/<string:complaint_id>/assign', methods=['PUT'])
@jwt_required()
def assign_complaint(complaint_id):
    """
    Assign complaint to an officer (admin only)
    """
    claims = get_jwt()
    role = claims.get('role', 'citizen')
    
    if role != 'admin':
        return jsonify({'message': 'Admin access required'}), 403
    
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    data = request.get_json()
    officer_id = data.get('officer_id')
    
    officer = User.query.filter_by(id=officer_id, role='officer').first()
    if not officer:
        return jsonify({'message': 'Officer not found'}), 404
    
    complaint.officer_id = officer_id
    if complaint.status == 'pending':
        complaint.status = 'in_progress'
    
    db.session.commit()
    
    return jsonify({
        'message': 'Complaint assigned',
        'complaint': complaint.to_dict()
    }), 200


@complaints_bp.route('/nearby', methods=['GET'])
@jwt_required()
def get_nearby_complaints():
    """
    Get complaints near a location
    """
    lat = request.args.get('lat', type=float)
    lng = request.args.get('lng', type=float)
    radius_km = request.args.get('radius', 1.0, type=float)
    
    if lat is None or lng is None:
        return jsonify({'message': 'Latitude and longitude required'}), 400
    
    # PostGIS distance query
    point = f"POINT({lng} {lat})"
    distance_query = text("""
        SELECT *, ST_Distance(location::geography, ST_GeomFromText(:point, 4326)::geography) / 1000 as distance_km
        FROM complaints
        WHERE ST_DWithin(location::geography, ST_GeomFromText(:point, 4326)::geography, :radius)
        ORDER BY distance_km
        LIMIT 50
    """)
    
    results = db.session.execute(
        distance_query,
        {'point': point, 'radius': radius_km * 1000}
    ).fetchall()
    
    complaints = []
    for row in results:
        complaint = Complaint.query.get(row.id)
        if complaint:
            data = complaint.to_dict()
            data['distance_km'] = round(row.distance_km, 2)
            complaints.append(data)
    
    return jsonify({'complaints': complaints}), 200


@complaints_bp.route('/track/<string:complaint_id>', methods=['GET'])
def track_complaint(complaint_id):
    """
    Public endpoint to track complaint status (no auth required)
    """
    complaint = Complaint.query.filter_by(complaint_id=complaint_id).first()
    
    if not complaint:
        return jsonify({'message': 'Complaint not found'}), 404
    
    return jsonify({
        'complaint_id': complaint.complaint_id,
        'title': complaint.title,
        'category': complaint.category,
        'status': complaint.status,
        'priority': complaint.priority,
        'created_at': complaint.created_at.isoformat(),
        'resolved_at': complaint.resolved_at.isoformat() if complaint.resolved_at else None,
        'status_updates': [
            {
                'status': u.new_status,
                'comment': u.comment,
                'date': u.created_at.isoformat()
            }
            for u in complaint.status_updates.order_by(StatusUpdate.created_at.asc()).all()
        ]
    }), 200
