"""
Complaint Service
Business logic for complaint management
"""
from datetime import datetime, timedelta
from typing import Optional, List, Dict
from sqlalchemy import func
from app import db
from app.models.models import Complaint, StatusUpdate, User, Department


class ComplaintService:
    """
    Service class for complaint-related business operations
    """
    
    # Department mappings for categories
    CATEGORY_DEPARTMENT_MAP = {
        'roads': 'Public Works Department',
        'water': 'Water Supply Department',
        'sanitation': 'Sanitation Department',
        'safety': 'Public Safety Department',
        'electricity': 'Electricity Department',
        'public_transport': 'Transport Department',
        'environment': 'Environment Department',
        'other': 'General Administration'
    }
    
    def get_department_for_category(self, category: str) -> str:
        """Get the appropriate department for a category"""
        return self.CATEGORY_DEPARTMENT_MAP.get(category, 'General Administration')
    
    def check_escalation(self, complaint: Complaint) -> bool:
        """
        Check if complaint needs escalation based on time thresholds
        Returns True if escalated
        """
        if complaint.status in ['resolved', 'closed']:
            return False
        
        # Get escalation thresholds (in hours)
        thresholds = {
            'critical': 4,
            'high': 24,
            'medium': 72,
            'low': 168
        }
        
        threshold_hours = thresholds.get(complaint.priority, 72)
        hours_pending = (datetime.utcnow() - complaint.created_at).total_seconds() / 3600
        
        if hours_pending > threshold_hours and complaint.escalation_level == 0:
            complaint.escalation_level = 1
            complaint.escalated_at = datetime.utcnow()
            return True
        
        # Second level escalation at 2x threshold
        if hours_pending > threshold_hours * 2 and complaint.escalation_level == 1:
            complaint.escalation_level = 2
            return True
        
        return False
    
    def auto_assign_complaint(self, complaint: Complaint) -> Optional[User]:
        """
        Automatically assign complaint to least loaded officer in department
        """
        department = complaint.department
        
        if not department:
            return None
        
        # Find officers in the department
        officers = User.query.filter_by(
            role='officer',
            department=department,
            is_active=True
        ).all()
        
        if not officers:
            return None
        
        # Find officer with least pending complaints
        min_load = float('inf')
        selected_officer = None
        
        for officer in officers:
            pending_count = Complaint.query.filter(
                Complaint.officer_id == officer.id,
                Complaint.status.in_(['pending', 'in_progress'])
            ).count()
            
            if pending_count < min_load:
                min_load = pending_count
                selected_officer = officer
        
        if selected_officer:
            complaint.officer_id = selected_officer.id
            return selected_officer
        
        return None
    
    def get_similar_complaints(
        self,
        latitude: float,
        longitude: float,
        category: str,
        radius_km: float = 0.5
    ) -> List[Complaint]:
        """
        Find similar complaints in the vicinity
        """
        # This would use PostGIS in production
        # Simple distance calculation for now
        complaints = Complaint.query.filter(
            Complaint.category == category,
            Complaint.status.in_(['pending', 'in_progress']),
            func.abs(Complaint.latitude - latitude) < radius_km / 111,  # Approximate conversion
            func.abs(Complaint.longitude - longitude) < radius_km / 111
        ).all()
        
        return complaints
    
    def mark_as_duplicate(
        self,
        complaint: Complaint,
        original_complaint: Complaint
    ) -> bool:
        """
        Mark a complaint as duplicate of another
        """
        if complaint.id == original_complaint.id:
            return False
        
        complaint.is_duplicate = True
        complaint.duplicate_of_id = original_complaint.id
        
        # Increase severity of original if multiple duplicates
        duplicate_count = Complaint.query.filter_by(
            duplicate_of_id=original_complaint.id
        ).count()
        
        if duplicate_count > 0:
            # Boost severity score for original complaint
            boost = min(duplicate_count * 0.1, 0.3)
            original_complaint.severity_score = min(
                original_complaint.severity_score + boost,
                1.0
            )
        
        return True
    
    def get_resolution_stats(self, days: int = 30) -> Dict:
        """
        Get resolution statistics for the specified period
        """
        start_date = datetime.utcnow() - timedelta(days=days)
        
        total = Complaint.query.filter(Complaint.created_at >= start_date).count()
        resolved = Complaint.query.filter(
            Complaint.resolved_at >= start_date
        ).count()
        
        # Average resolution time
        avg_time = db.session.query(
            func.avg(
                func.extract('epoch', Complaint.resolved_at - Complaint.created_at) / 3600
            )
        ).filter(
            Complaint.resolved_at >= start_date
        ).scalar() or 0
        
        return {
            'period_days': days,
            'total': total,
            'resolved': resolved,
            'resolution_rate': round(resolved / total * 100, 2) if total > 0 else 0,
            'avg_resolution_hours': round(avg_time, 2)
        }
    
    def run_escalation_check(self) -> int:
        """
        Run escalation check on all pending complaints
        Returns number of escalated complaints
        """
        pending = Complaint.query.filter(
            Complaint.status.in_(['pending', 'in_progress'])
        ).all()
        
        escalated_count = 0
        for complaint in pending:
            if self.check_escalation(complaint):
                escalated_count += 1
        
        db.session.commit()
        return escalated_count
    
    def get_workload_summary(self) -> Dict:
        """
        Get workload summary by department
        """
        departments = db.session.query(
            Complaint.department,
            func.count(Complaint.id).label('total'),
            func.count(Complaint.id).filter(Complaint.status == 'pending').label('pending'),
            func.count(Complaint.id).filter(Complaint.status == 'in_progress').label('in_progress')
        ).group_by(Complaint.department).all()
        
        return {
            dept.department: {
                'total': dept.total,
                'pending': dept.pending,
                'in_progress': dept.in_progress
            }
            for dept in departments if dept.department
        }
    
    def close_stale_resolved(self, days_threshold: int = 7) -> int:
        """
        Auto-close complaints that have been resolved for X days
        """
        threshold = datetime.utcnow() - timedelta(days=days_threshold)
        
        stale_complaints = Complaint.query.filter(
            Complaint.status == 'resolved',
            Complaint.resolved_at < threshold
        ).all()
        
        for complaint in stale_complaints:
            complaint.status = 'closed'
        
        db.session.commit()
        return len(stale_complaints)
