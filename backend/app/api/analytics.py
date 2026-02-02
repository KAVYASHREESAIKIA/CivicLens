"""
Analytics API Routes
City-wide analytics, trends, and reporting
"""
from datetime import datetime, timedelta
from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt
from sqlalchemy import func, text
from app import db
from app.models.models import Complaint, User

analytics_bp = Blueprint('analytics', __name__)


def auth_required(fn):
    """Decorator to require any authenticated user (officer or admin)"""
    from functools import wraps
    
    @wraps(fn)
    @jwt_required()
    def wrapper(*args, **kwargs):
        claims = get_jwt()
        if claims.get('role') not in ['officer', 'admin']:
            return jsonify({'message': 'Access denied'}), 403
        return fn(*args, **kwargs)
    
    return wrapper


@analytics_bp.route('/overview', methods=['GET'])
@auth_required
def get_overview():
    """
    Get city-wide analytics overview
    """
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Total complaints in period
    total = Complaint.query.filter(Complaint.created_at >= start_date).count()
    
    # Resolved in period
    resolved = Complaint.query.filter(
        Complaint.resolved_at >= start_date
    ).count()
    
    # Resolution rate
    resolution_rate = (resolved / total * 100) if total > 0 else 0
    
    # Average resolution time
    avg_time = db.session.query(
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        )
    ).filter(
        Complaint.resolved_at >= start_date
    ).scalar() or 0
    
    # Pending complaints
    pending = Complaint.query.filter(
        Complaint.status.in_(['pending', 'in_progress'])
    ).count()
    
    return jsonify({
        'period_days': days,
        'total_complaints': total,
        'resolved': resolved,
        'resolution_rate': round(resolution_rate, 2),
        'avg_resolution_hours': round(avg_time, 2),
        'pending': pending
    }), 200


@analytics_bp.route('/trends', methods=['GET'])
@auth_required
def get_trends():
    """
    Get complaint trends over time
    """
    days = request.args.get('days', 30, type=int)
    granularity = request.args.get('granularity', 'day')  # day, week, month
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    if granularity == 'day':
        date_trunc = func.date(Complaint.created_at)
    elif granularity == 'week':
        date_trunc = func.date_trunc('week', Complaint.created_at)
    else:
        date_trunc = func.date_trunc('month', Complaint.created_at)
    
    # Complaints over time
    trends = db.session.query(
        date_trunc.label('period'),
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.created_at >= start_date
    ).group_by(date_trunc).order_by(date_trunc).all()
    
    # Resolutions over time
    resolution_trends = db.session.query(
        func.date(Complaint.resolved_at).label('period'),
        func.count(Complaint.id).label('count')
    ).filter(
        Complaint.resolved_at >= start_date
    ).group_by(func.date(Complaint.resolved_at)).order_by(func.date(Complaint.resolved_at)).all()
    
    return jsonify({
        'complaints_trend': [
            {'period': str(t.period), 'count': t.count}
            for t in trends
        ],
        'resolutions_trend': [
            {'period': str(t.period), 'count': t.count}
            for t in resolution_trends
        ]
    }), 200


@analytics_bp.route('/categories', methods=['GET'])
@auth_required
def get_category_analytics():
    """
    Get analytics by category
    """
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Count by category
    category_counts = db.session.query(
        Complaint.category,
        func.count(Complaint.id).label('total'),
        func.count(Complaint.id).filter(Complaint.status == 'resolved').label('resolved'),
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        ).label('avg_resolution_hours')
    ).filter(
        Complaint.created_at >= start_date
    ).group_by(Complaint.category).all()
    
    result = []
    for cat in category_counts:
        result.append({
            'category': cat.category,
            'total': cat.total,
            'resolved': cat.resolved or 0,
            'pending': cat.total - (cat.resolved or 0),
            'resolution_rate': round((cat.resolved or 0) / cat.total * 100, 2) if cat.total > 0 else 0,
            'avg_resolution_hours': round(cat.avg_resolution_hours or 0, 2)
        })
    
    return jsonify({'categories': result}), 200


@analytics_bp.route('/zones', methods=['GET'])
@auth_required
def get_zone_analytics():
    """
    Get analytics by zone/ward
    """
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Top problematic zones
    zone_stats = db.session.query(
        Complaint.zone,
        func.count(Complaint.id).label('total'),
        func.count(Complaint.id).filter(Complaint.status == 'resolved').label('resolved'),
        func.avg(Complaint.severity_score).label('avg_severity')
    ).filter(
        Complaint.created_at >= start_date,
        Complaint.zone.isnot(None)
    ).group_by(Complaint.zone).order_by(func.count(Complaint.id).desc()).limit(20).all()
    
    result = []
    for zone in zone_stats:
        result.append({
            'zone': zone.zone,
            'total': zone.total,
            'resolved': zone.resolved or 0,
            'pending': zone.total - (zone.resolved or 0),
            'avg_severity': round(zone.avg_severity or 0, 2)
        })
    
    return jsonify({'zones': result}), 200


@analytics_bp.route('/departments', methods=['GET'])
@auth_required
def get_department_analytics():
    """
    Get department performance comparison
    """
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    dept_stats = db.session.query(
        Complaint.department,
        func.count(Complaint.id).label('total'),
        func.count(Complaint.id).filter(Complaint.status == 'resolved').label('resolved'),
        func.count(Complaint.id).filter(Complaint.status == 'pending').label('pending'),
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        ).label('avg_resolution_hours')
    ).filter(
        Complaint.created_at >= start_date,
        Complaint.department.isnot(None)
    ).group_by(Complaint.department).all()
    
    result = []
    for dept in dept_stats:
        result.append({
            'department': dept.department,
            'total': dept.total,
            'resolved': dept.resolved or 0,
            'pending': dept.pending or 0,
            'in_progress': dept.total - (dept.resolved or 0) - (dept.pending or 0),
            'resolution_rate': round((dept.resolved or 0) / dept.total * 100, 2) if dept.total > 0 else 0,
            'avg_resolution_hours': round(dept.avg_resolution_hours or 0, 2)
        })
    
    return jsonify({'departments': result}), 200


@analytics_bp.route('/hotspots', methods=['GET'])
@auth_required
def get_hotspots():
    """
    Get complaint hotspots using clustering
    """
    days = request.args.get('days', 30, type=int)
    category = request.args.get('category')
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = Complaint.query.filter(Complaint.created_at >= start_date)
    
    if category:
        query = query.filter_by(category=category)
    
    complaints = query.all()
    
    # Simple grid-based clustering
    clusters = {}
    grid_size = 0.01  # Approximately 1km
    
    for c in complaints:
        grid_lat = round(c.latitude / grid_size) * grid_size
        grid_lng = round(c.longitude / grid_size) * grid_size
        key = f"{grid_lat},{grid_lng}"
        
        if key not in clusters:
            clusters[key] = {
                'lat': grid_lat,
                'lng': grid_lng,
                'count': 0,
                'avg_severity': 0,
                'categories': {}
            }
        
        clusters[key]['count'] += 1
        clusters[key]['avg_severity'] += c.severity_score
        clusters[key]['categories'][c.category] = clusters[key]['categories'].get(c.category, 0) + 1
    
    # Finalize averages and sort by count
    hotspots = []
    for key, cluster in clusters.items():
        cluster['avg_severity'] = round(cluster['avg_severity'] / cluster['count'], 2)
        cluster['top_category'] = max(cluster['categories'], key=cluster['categories'].get) if cluster['categories'] else None
        del cluster['categories']
        hotspots.append(cluster)
    
    hotspots.sort(key=lambda x: x['count'], reverse=True)
    
    return jsonify({'hotspots': hotspots[:50]}), 200


@analytics_bp.route('/resolution-times', methods=['GET'])
@auth_required
def get_resolution_times():
    """
    Get resolution time distribution
    """
    days = request.args.get('days', 90, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Resolution time by priority
    priority_times = db.session.query(
        Complaint.priority,
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        ).label('avg_hours'),
        func.min(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        ).label('min_hours'),
        func.max(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        ).label('max_hours')
    ).filter(
        Complaint.resolved_at >= start_date
    ).group_by(Complaint.priority).all()
    
    return jsonify({
        'by_priority': [
            {
                'priority': p.priority,
                'avg_hours': round(p.avg_hours or 0, 2),
                'min_hours': round(p.min_hours or 0, 2),
                'max_hours': round(p.max_hours or 0, 2)
            }
            for p in priority_times
        ]
    }), 200


@analytics_bp.route('/officer-leaderboard', methods=['GET'])
@auth_required
def get_officer_leaderboard():
    """
    Get officer performance leaderboard
    """
    days = request.args.get('days', 30, type=int)
    start_date = datetime.utcnow() - timedelta(days=days)
    
    # Officer performance
    officers = db.session.query(
        User.id,
        User.first_name,
        User.last_name,
        User.department,
        func.count(Complaint.id).label('resolved'),
        func.avg(
            func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
        ).label('avg_resolution_hours')
    ).join(
        Complaint, Complaint.officer_id == User.id
    ).filter(
        Complaint.resolved_at >= start_date
    ).group_by(
        User.id, User.first_name, User.last_name, User.department
    ).order_by(
        func.count(Complaint.id).desc()
    ).limit(20).all()
    
    return jsonify({
        'leaderboard': [
            {
                'id': o.id,
                'name': f"{o.first_name} {o.last_name}",
                'department': o.department,
                'resolved': o.resolved,
                'avg_resolution_hours': round(o.avg_resolution_hours or 0, 2)
            }
            for o in officers
        ]
    }), 200


@analytics_bp.route('/export', methods=['GET'])
@auth_required
def export_data():
    """
    Export complaints data (limited to prevent performance issues)
    """
    days = request.args.get('days', 30, type=int)
    category = request.args.get('category')
    status = request.args.get('status')
    
    start_date = datetime.utcnow() - timedelta(days=days)
    
    query = Complaint.query.filter(Complaint.created_at >= start_date)
    
    if category:
        query = query.filter_by(category=category)
    if status:
        query = query.filter_by(status=status)
    
    complaints = query.limit(1000).all()
    
    return jsonify({
        'count': len(complaints),
        'data': [c.to_dict() for c in complaints]
    }), 200
