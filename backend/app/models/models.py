"""
CivicLens Database Models
User, Complaint, and related entities
"""
from datetime import datetime
from geoalchemy2 import Geometry
from app import db


class User(db.Model):
    """User model for citizens, officers, and admins"""
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(255), nullable=False)
    first_name = db.Column(db.String(100), nullable=False)
    last_name = db.Column(db.String(100), nullable=False)
    phone = db.Column(db.String(20))
    role = db.Column(db.String(20), nullable=False, default='citizen')  # citizen, officer, admin
    department = db.Column(db.String(100))  # For officers
    is_active = db.Column(db.Boolean, default=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    complaints = db.relationship('Complaint', backref='reporter', lazy='dynamic', foreign_keys='Complaint.user_id')
    assigned_complaints = db.relationship('Complaint', backref='assigned_officer', lazy='dynamic', foreign_keys='Complaint.officer_id')
    status_updates = db.relationship('StatusUpdate', backref='updated_by_user', lazy='dynamic')
    
    def to_dict(self):
        return {
            'id': self.id,
            'email': self.email,
            'first_name': self.first_name,
            'last_name': self.last_name,
            'full_name': f"{self.first_name} {self.last_name}",
            'phone': self.phone,
            'role': self.role,
            'department': self.department,
            'is_active': self.is_active,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Complaint(db.Model):
    """Main complaint model with geospatial support"""
    __tablename__ = 'complaints'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.String(20), unique=True, nullable=False, index=True)  # CL-2026-000001
    
    # Reporter info
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False, index=True)
    
    # Complaint details
    title = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False, index=True)
    ai_category = db.Column(db.String(50))  # AI-predicted category
    category_confidence = db.Column(db.Float)  # AI confidence score
    
    # Location
    address = db.Column(db.String(500))
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    location = db.Column(Geometry('POINT', srid=4326))  # PostGIS geometry
    ward = db.Column(db.String(100))
    zone = db.Column(db.String(100))
    
    # Media
    image_url = db.Column(db.String(500))
    
    # Status & Priority
    status = db.Column(db.String(50), default='pending', index=True)  # pending, in_progress, resolved, closed, rejected
    priority = db.Column(db.String(20), default='medium', index=True)  # critical, high, medium, low
    severity_score = db.Column(db.Float, default=0.5)
    
    # Assignment
    officer_id = db.Column(db.Integer, db.ForeignKey('users.id'), index=True)
    department = db.Column(db.String(100), index=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, index=True)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    resolved_at = db.Column(db.DateTime)
    escalated_at = db.Column(db.DateTime)
    
    # Analytics
    is_duplicate = db.Column(db.Boolean, default=False)
    duplicate_of_id = db.Column(db.Integer, db.ForeignKey('complaints.id'))
    escalation_level = db.Column(db.Integer, default=0)
    
    # Relationships
    status_updates = db.relationship('StatusUpdate', backref='complaint', lazy='dynamic', order_by='StatusUpdate.created_at.desc()')
    duplicates = db.relationship('Complaint', backref=db.backref('original_complaint', remote_side=[id]), lazy='dynamic')
    
    def to_dict(self, include_updates=False):
        result = {
            'id': self.id,
            'complaint_id': self.complaint_id,
            'title': self.title,
            'description': self.description,
            'category': self.category,
            'ai_category': self.ai_category,
            'category_confidence': self.category_confidence,
            'address': self.address,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'ward': self.ward,
            'zone': self.zone,
            'image_url': self.image_url,
            'status': self.status,
            'priority': self.priority,
            'severity_score': self.severity_score,
            'department': self.department,
            'reporter': self.reporter.to_dict() if self.reporter else None,
            'officer': self.assigned_officer.to_dict() if self.assigned_officer else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None,
            'resolved_at': self.resolved_at.isoformat() if self.resolved_at else None,
            'escalation_level': self.escalation_level,
            'is_duplicate': self.is_duplicate
        }
        
        if include_updates:
            result['status_updates'] = [update.to_dict() for update in self.status_updates.limit(10).all()]
        
        return result


class StatusUpdate(db.Model):
    """Status update history for complaints"""
    __tablename__ = 'status_updates'
    
    id = db.Column(db.Integer, primary_key=True)
    complaint_id = db.Column(db.Integer, db.ForeignKey('complaints.id'), nullable=False, index=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    previous_status = db.Column(db.String(50))
    new_status = db.Column(db.String(50), nullable=False)
    comment = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        return {
            'id': self.id,
            'previous_status': self.previous_status,
            'new_status': self.new_status,
            'comment': self.comment,
            'updated_by': self.updated_by_user.to_dict() if self.updated_by_user else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class ImportantLocation(db.Model):
    """Important locations for severity calculation"""
    __tablename__ = 'important_locations'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(200), nullable=False)
    location_type = db.Column(db.String(50), nullable=False)  # hospital, school, etc.
    latitude = db.Column(db.Float, nullable=False)
    longitude = db.Column(db.Float, nullable=False)
    location = db.Column(Geometry('POINT', srid=4326))
    importance_weight = db.Column(db.Float, default=1.0)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'location_type': self.location_type,
            'latitude': self.latitude,
            'longitude': self.longitude,
            'importance_weight': self.importance_weight
        }


class Department(db.Model):
    """Department model for officer assignment"""
    __tablename__ = 'departments'
    
    id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(100), unique=True, nullable=False)
    code = db.Column(db.String(20), unique=True, nullable=False)
    categories = db.Column(db.ARRAY(db.String))  # Categories this department handles
    head_officer_id = db.Column(db.Integer, db.ForeignKey('users.id'))
    is_active = db.Column(db.Boolean, default=True)
    
    def to_dict(self):
        return {
            'id': self.id,
            'name': self.name,
            'code': self.code,
            'categories': self.categories,
            'is_active': self.is_active
        }
