"""
CivicLens Backend Entry Point
"""
from app import create_app, db
from app.models.models import User, Complaint, StatusUpdate, Department, ImportantLocation

app = create_app()


@app.shell_context_processor
def make_shell_context():
    """Make database models available in Flask shell"""
    return {
        'db': db,
        'User': User,
        'Complaint': Complaint,
        'StatusUpdate': StatusUpdate,
        'Department': Department,
        'ImportantLocation': ImportantLocation
    }


@app.cli.command('init-db')
def init_db():
    """Initialize the database with tables and default data"""
    import click
    
    db.create_all()
    click.echo('Database tables created.')
    
    # Create default admin user
    from app import bcrypt
    
    admin = User.query.filter_by(email='admin@civiclens.gov').first()
    if not admin:
        admin = User(
            email='admin@civiclens.gov',
            password_hash=bcrypt.generate_password_hash('admin123').decode('utf-8'),
            first_name='System',
            last_name='Administrator',
            role='admin',
            is_active=True
        )
        db.session.add(admin)
        click.echo('Admin user created: admin@civiclens.gov / admin123')
    
    # Create default departments
    default_departments = [
        {'name': 'Public Works Department', 'code': 'PWD', 'categories': ['roads']},
        {'name': 'Water Supply Department', 'code': 'WSD', 'categories': ['water']},
        {'name': 'Sanitation Department', 'code': 'SAN', 'categories': ['sanitation']},
        {'name': 'Public Safety Department', 'code': 'PSD', 'categories': ['safety']},
        {'name': 'Electricity Department', 'code': 'ELE', 'categories': ['electricity']},
        {'name': 'Transport Department', 'code': 'TRD', 'categories': ['public_transport']},
        {'name': 'Environment Department', 'code': 'ENV', 'categories': ['environment']},
        {'name': 'General Administration', 'code': 'GEN', 'categories': ['other']},
    ]
    
    for dept_data in default_departments:
        dept = Department.query.filter_by(code=dept_data['code']).first()
        if not dept:
            dept = Department(**dept_data)
            db.session.add(dept)
    
    db.session.commit()
    click.echo('Default departments created.')


@app.cli.command('create-demo-data')
def create_demo_data():
    """Create demo data for testing"""
    import click
    import random
    from datetime import datetime, timedelta
    from app import bcrypt
    
    # Create demo officers
    officers = []
    departments = ['Public Works Department', 'Water Supply Department', 'Sanitation Department']
    
    for i, dept in enumerate(departments):
        officer = User.query.filter_by(email=f'officer{i+1}@civiclens.gov').first()
        if not officer:
            officer = User(
                email=f'officer{i+1}@civiclens.gov',
                password_hash=bcrypt.generate_password_hash('officer123').decode('utf-8'),
                first_name=f'Officer',
                last_name=f'{i+1}',
                role='officer',
                department=dept,
                is_active=True
            )
            db.session.add(officer)
            officers.append(officer)
    
    # Create demo citizen
    citizen = User.query.filter_by(email='citizen@example.com').first()
    if not citizen:
        citizen = User(
            email='citizen@example.com',
            password_hash=bcrypt.generate_password_hash('citizen123').decode('utf-8'),
            first_name='Demo',
            last_name='Citizen',
            role='citizen',
            is_active=True
        )
        db.session.add(citizen)
    
    db.session.commit()
    
    # Create demo complaints
    categories = ['roads', 'water', 'sanitation']
    statuses = ['pending', 'in_progress', 'resolved']
    priorities = ['low', 'medium', 'high', 'critical']
    
    # Delhi area coordinates
    base_lat, base_lng = 28.6139, 77.2090
    
    for i in range(50):
        days_ago = random.randint(0, 30)
        created = datetime.utcnow() - timedelta(days=days_ago)
        
        category = random.choice(categories)
        status = random.choice(statuses)
        priority = random.choice(priorities)
        
        lat = base_lat + random.uniform(-0.1, 0.1)
        lng = base_lng + random.uniform(-0.1, 0.1)
        
        year = datetime.utcnow().year
        complaint = Complaint(
            complaint_id=f'CL-{year}-{1000+i:06d}',
            user_id=citizen.id,
            title=f'Demo {category} complaint #{i+1}',
            description=f'This is a demo {category} complaint for testing purposes. The issue is {priority} priority.',
            category=category,
            latitude=lat,
            longitude=lng,
            status=status,
            priority=priority,
            severity_score=random.uniform(0.2, 1.0),
            department=departments[categories.index(category)],
            created_at=created
        )
        
        if status == 'resolved':
            complaint.resolved_at = created + timedelta(hours=random.randint(1, 72))
        
        db.session.add(complaint)
    
    db.session.commit()
    click.echo('Demo data created: 50 complaints, 3 officers, 1 citizen')


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)
