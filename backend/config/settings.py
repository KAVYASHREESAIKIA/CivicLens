"""
CivicLens Configuration Settings
Environment-based configuration for development, testing, and production
"""
import os
from datetime import timedelta
from dotenv import load_dotenv

load_dotenv()


class Config:
    """Base configuration class"""
    
    # Application
    APP_NAME = "CivicLens"
    VERSION = "1.0.0"
    SECRET_KEY = os.environ.get('SECRET_KEY', 'dev-secret-key-change-in-production')
    
    # Database - PostgreSQL with PostGIS
    SQLALCHEMY_DATABASE_URI = os.environ.get(
        'DATABASE_URL',
        'postgresql://postgres:postgres@localhost:5432/civiclens'
    )
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_size': 10,
        'pool_recycle': 300,
        'pool_pre_ping': True
    }
    
    # JWT Configuration
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY', 'jwt-secret-key-change-in-production')
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    JWT_TOKEN_LOCATION = ['headers']
    JWT_HEADER_NAME = 'Authorization'
    JWT_HEADER_TYPE = 'Bearer'
    
    # File Upload
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'uploads')
    MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
    ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg', 'gif', 'webp'}
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # AI/ML Configuration
    ML_MODEL_PATH = os.path.join(os.path.dirname(os.path.dirname(__file__)), 'ml_models')
    SEVERITY_WEIGHTS = {
        'keyword_urgency': 0.3,
        'nearby_complaints': 0.2,
        'time_unresolved': 0.2,
        'location_importance': 0.3
    }
    
    # Complaint Categories
    COMPLAINT_CATEGORIES = [
        'roads',
        'water',
        'sanitation',
        'safety',
        'electricity',
        'public_transport',
        'environment',
        'other'
    ]
    
    # Escalation Configuration (in hours)
    ESCALATION_THRESHOLDS = {
        'critical': 4,
        'high': 24,
        'medium': 72,
        'low': 168
    }
    
    # Geospatial Configuration
    DEFAULT_CITY_CENTER = {
        'lat': float(os.environ.get('DEFAULT_LAT', '28.6139')),
        'lng': float(os.environ.get('DEFAULT_LNG', '77.2090'))
    }
    NEARBY_RADIUS_KM = 0.5  # 500 meters
    
    # Important Locations (hospitals, schools, etc.)
    IMPORTANT_LOCATION_TYPES = [
        'hospital',
        'school',
        'government_office',
        'police_station',
        'fire_station',
        'public_transport_hub'
    ]


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    TESTING = False
    

class TestingConfig(Config):
    """Testing configuration"""
    DEBUG = True
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'postgresql://postgres:postgres@localhost:5432/civiclens_test'
    

class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    TESTING = False
    
    # Override with stronger security in production
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(minutes=30)
    

# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}


def get_config():
    """Get configuration based on environment"""
    env = os.environ.get('FLASK_ENV', 'development')
    return config.get(env, config['default'])
