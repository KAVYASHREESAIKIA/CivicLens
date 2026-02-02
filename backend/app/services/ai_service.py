"""
AI Service for Complaint Processing
NLP-based categorization and severity scoring
"""
import os
import re
import math
from typing import Dict, Tuple, Optional
from flask import current_app


class AIService:
    """
    AI-powered complaint analysis service
    Handles categorization, severity scoring, and duplicate detection
    """
    
    def __init__(self):
        self.model = None
        self.vectorizer = None
        self.categories = [
            'roads', 'water', 'sanitation', 'safety', 'electricity',
            'public_transport', 'environment', 'other'
        ]
        
        # Urgency keywords for severity calculation
        self.urgency_keywords = {
            'critical': [
                'emergency', 'urgent', 'danger', 'life threatening', 'fire',
                'accident', 'flood', 'collapsed', 'explosion', 'gas leak',
                'electrocution', 'drowning', 'death', 'injured'
            ],
            'high': [
                'immediate', 'severe', 'major', 'broken', 'blocked',
                'overflow', 'leakage', 'exposure', 'hazard', 'risk',
                'children', 'elderly', 'disabled', 'hospital', 'school'
            ],
            'medium': [
                'damaged', 'poor', 'problem', 'issue', 'concern',
                'inconvenience', 'delay', 'irregular', 'complaint'
            ],
            'low': [
                'minor', 'small', 'slight', 'cosmetic', 'suggestion',
                'improvement', 'future', 'eventually'
            ]
        }
        
        # Category keywords for rule-based classification fallback
        self.category_keywords = {
            'roads': [
                'road', 'pothole', 'street', 'highway', 'pavement', 'sidewalk',
                'traffic', 'signal', 'footpath', 'crossing', 'bridge', 'asphalt'
            ],
            'water': [
                'water', 'pipeline', 'tap', 'supply', 'drinking', 'tank',
                'bore', 'well', 'pump', 'contaminated', 'dirty water'
            ],
            'sanitation': [
                'garbage', 'waste', 'sewage', 'drain', 'toilet', 'trash',
                'cleaning', 'dustbin', 'sweeping', 'stench', 'smell', 'hygiene'
            ],
            'safety': [
                'crime', 'theft', 'robbery', 'harassment', 'police', 'security',
                'unsafe', 'dark', 'lighting', 'cctv', 'patrol', 'violence'
            ],
            'electricity': [
                'power', 'electric', 'outage', 'blackout', 'transformer',
                'wire', 'cable', 'meter', 'voltage', 'short circuit', 'pole'
            ],
            'public_transport': [
                'bus', 'metro', 'train', 'transport', 'station', 'stop',
                'schedule', 'route', 'ticket', 'fare', 'overcrowded'
            ],
            'environment': [
                'tree', 'park', 'pollution', 'noise', 'air quality', 'green',
                'garden', 'plant', 'animal', 'stray', 'mosquito', 'pest'
            ]
        }
    
    def load_model(self):
        """
        Load or train the classification model
        For this simplified version, we'll stick to keyword-based classification
        to avoid memory issues on resource-constrained environments.
        """
        self.model = None
        return False
    
    def train_model(self, texts: list, labels: list):
        """Train the classification model with new data"""
        # ML training disabled for stability
        pass
    
    def classify_category(self, text: str) -> Tuple[str, float]:
        """
        Classify complaint text into category
        Returns (category, confidence)
        """
        text_lower = text.lower()
        
        # Keyword-based classification only
        category_scores = {}
        
        for category, keywords in self.category_keywords.items():
            score = sum(1 for kw in keywords if kw in text_lower)
            if score > 0:
                category_scores[category] = score
        
        if category_scores:
            best_category = max(category_scores, key=category_scores.get)
            max_score = category_scores[best_category]
            total_score = sum(category_scores.values())
            confidence = max_score / total_score if total_score > 0 else 0.5
            return best_category, min(confidence, 0.9)
        
        return 'other', 0.3
    
    def calculate_keyword_urgency(self, text: str) -> float:
        """
        Calculate urgency score based on keywords
        Returns score between 0 and 1
        """
        text_lower = text.lower()
        
        # Check for critical keywords first
        for keyword in self.urgency_keywords['critical']:
            if keyword in text_lower:
                return 1.0
        
        # Calculate weighted score
        critical_count = sum(1 for kw in self.urgency_keywords['critical'] if kw in text_lower)
        high_count = sum(1 for kw in self.urgency_keywords['high'] if kw in text_lower)
        medium_count = sum(1 for kw in self.urgency_keywords['medium'] if kw in text_lower)
        low_count = sum(1 for kw in self.urgency_keywords['low'] if kw in text_lower)
        
        # Weighted calculation
        score = (critical_count * 1.0 + high_count * 0.7 + medium_count * 0.4 + low_count * 0.1)
        total = critical_count + high_count + medium_count + low_count
        
        if total > 0:
            return min(score / total, 1.0)
        
        return 0.3  # Default medium-low urgency
    
    def calculate_location_importance(self, latitude: float, longitude: float) -> float:
        """
        Calculate location importance based on proximity to important places
        In production, this would query the ImportantLocation table
        """
        # Placeholder - would integrate with PostGIS queries
        # For now, return a default value
        return 0.5
    
    def get_nearby_complaint_factor(self, latitude: float, longitude: float, category: str) -> float:
        """
        Calculate factor based on similar complaints nearby
        Higher score if there are many similar complaints in the area
        """
        # This would query the database in production
        # For now, return a default value
        return 0.3
    
    def calculate_severity_score(
        self,
        text: str,
        category: str,
        latitude: float,
        longitude: float,
        time_unresolved_hours: float = 0
    ) -> float:
        """
        Calculate comprehensive severity score using:
        - Keyword urgency
        - Similar complaints nearby
        - Time unresolved
        - Location importance
        """
        # Get weights from config or use defaults
        try:
            weights = current_app.config.get('SEVERITY_WEIGHTS', {
                'keyword_urgency': 0.3,
                'nearby_complaints': 0.2,
                'time_unresolved': 0.2,
                'location_importance': 0.3
            })
        except RuntimeError:
            weights = {
                'keyword_urgency': 0.3,
                'nearby_complaints': 0.2,
                'time_unresolved': 0.2,
                'location_importance': 0.3
            }
        
        # Calculate individual components
        keyword_score = self.calculate_keyword_urgency(text)
        location_score = self.calculate_location_importance(latitude, longitude)
        nearby_score = self.get_nearby_complaint_factor(latitude, longitude, category)
        
        # Time factor - increases with time unresolved (caps at 1.0)
        time_factor = min(time_unresolved_hours / 168, 1.0)  # 168 hours = 1 week
        
        # Weighted combination
        severity = (
            weights['keyword_urgency'] * keyword_score +
            weights['nearby_complaints'] * nearby_score +
            weights['time_unresolved'] * time_factor +
            weights['location_importance'] * location_score
        )
        
        return round(min(severity, 1.0), 3)
    
    def get_priority_from_score(self, severity_score: float) -> str:
        """Convert severity score to priority level"""
        if severity_score >= 0.8:
            return 'critical'
        elif severity_score >= 0.6:
            return 'high'
        elif severity_score >= 0.4:
            return 'medium'
        else:
            return 'low'
    
    def process_complaint(
        self,
        text: str,
        category: Optional[str] = None,
        latitude: float = 0,
        longitude: float = 0
    ) -> Dict:
        """
        Main entry point for AI processing of complaints
        """
        # Classify category
        ai_category, confidence = self.classify_category(text)
        
        # Use user-provided category if available and valid
        final_category = category if category in self.categories else ai_category
        
        # Calculate severity
        severity_score = self.calculate_severity_score(
            text=text,
            category=final_category,
            latitude=latitude,
            longitude=longitude
        )
        
        # Determine priority
        priority = self.get_priority_from_score(severity_score)
        
        return {
            'category': final_category,
            'ai_category': ai_category,
            'confidence': round(confidence, 3),
            'severity_score': severity_score,
            'priority': priority
        }
    
    def find_similar_complaints(self, text: str, threshold: float = 0.7) -> list:
        """
        Find similar complaints for duplicate detection
        Uses TF-IDF cosine similarity
        """
        # This would be implemented with database integration
        # For now, return empty list
        return []
    
    def extract_entities(self, text: str) -> Dict:
        """
        Extract named entities from complaint text
        (location names, landmarks, etc.)
        """
        # Simple pattern matching for common entities
        entities = {
            'locations': [],
            'landmarks': [],
            'numbers': []
        }
        
        # Extract potential location references
        location_patterns = [
            r'near\s+(\w+(?:\s+\w+){0,3})',
            r'at\s+(\w+(?:\s+\w+){0,3})',
            r'in\s+(\w+(?:\s+\w+){0,2})\s+area',
            r'(\w+)\s+road',
            r'(\w+)\s+street'
        ]
        
        for pattern in location_patterns:
            matches = re.findall(pattern, text, re.IGNORECASE)
            entities['locations'].extend(matches)
        
        # Extract numbers (could be address, phone, etc.)
        numbers = re.findall(r'\b\d+\b', text)
        entities['numbers'] = numbers
        
        return entities
