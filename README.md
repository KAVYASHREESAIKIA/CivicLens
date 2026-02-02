# CivicLens - AI-Powered Civic Problem Intelligence Platform


## 🌟 Overview

CivicLens is a production-ready, full-stack, AI-powered civic problem intelligence platform designed to revolutionize how cities handle citizen complaints. The platform leverages modern web technologies, machine learning, and geospatial analysis to provide intelligent complaint routing, priority assessment, and actionable insights for city administrators.

## ✨ Key Features

### For Citizens
- **Easy Complaint Submission** - Report issues with photos, location, and detailed descriptions
- **Real-time Tracking** - Track complaint status with unique IDs
- **Mobile-Friendly** - Responsive design works on all devices
- **Transparent Updates** - Get notified as your complaint progresses

### For Officers
- **Smart Dashboard** - View assigned complaints with priority indicators
- **Quick Actions** - Update status, add notes, and resolve issues efficiently
- **Performance Tracking** - Monitor personal resolution metrics
- **Department View** - Access department-wide complaint overview

### For Administrators
- **AI-Powered Analytics** - Comprehensive city-wide insights
- **Interactive Heatmaps** - Visualize problem hotspots geographically
- **Smart Assignment** - AI-assisted complaint routing to departments
- **User Management** - Full control over officers and citizens
- **Trend Analysis** - Identify patterns and predict issues

## 🛠️ Tech Stack

### Frontend
- **React.js 19** - Modern component-based UI
- **Vite** - Lightning-fast build tool
- **Tailwind CSS 4** - Utility-first styling
- **React Router 7** - Client-side routing
- **Recharts** - Beautiful data visualizations
- **Leaflet.js** - Interactive maps
- **Heroicons** - Beautiful icons
- **React Hook Form** - Form management
- **Axios** - HTTP client

### Backend
- **Flask** - Lightweight Python web framework
- **Flask-RESTful** - RESTful API development
- **Flask-SQLAlchemy** - ORM for database operations
- **Flask-JWT-Extended** - JWT authentication
- **PostgreSQL + PostGIS** - Geospatial database
- **Flask-Migrate** - Database migrations
- **Flask-CORS** - Cross-origin resource sharing

### AI/ML Engine
- **scikit-learn** - Machine learning algorithms
- **NLTK** - Natural language processing
- **TF-IDF Vectorization** - Text analysis
- **Logistic Regression** - Category prediction
- **Custom Severity Scoring** - Priority assessment

## 📁 Project Structure

```
CivicLens/
├── backend/
│   ├── app/
│   │   ├── api/           # API endpoints (auth, complaints, admin, officer, analytics)
│   │   ├── models/        # SQLAlchemy database models
│   │   ├── services/      # Business logic (AI service, complaint service)
│   │   └── utils/         # Helper utilities
│   ├── config/            # Configuration settings
│   ├── migrations/        # Database migrations
│   ├── tests/             # Unit and integration tests
│   ├── requirements.txt   # Python dependencies
│   └── run.py            # Application entry point
│
├── frontend/
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── context/       # React context providers
│   │   ├── pages/         # Page components
│   │   │   ├── citizen/   # Citizen dashboard, complaints
│   │   │   ├── admin/     # Admin dashboard, analytics
│   │   │   └── officer/   # Officer dashboard, assignments
│   │   ├── services/      # API service layer
│   │   └── hooks/         # Custom React hooks
│   ├── index.html
│   └── vite.config.js
│
├── ml_engine/             # ML models and training
├── docker/                # Docker configurations
└── docs/                  # Documentation
```

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.x
- **Python** >= 3.9
- **PostgreSQL** >= 13 with PostGIS extension
- **npm** or **yarn**

### Backend Setup

1. **Navigate to backend directory:**
   ```bash
   cd backend
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your database credentials and settings
   ```

5. **Initialize database:**
   ```bash
   flask init-db
   flask create-demo-data  # Optional: Add sample data
   ```

6. **Run the server:**
   ```bash
   flask run
   ```

### Frontend Setup

1. **Navigate to frontend directory:**
   ```bash
   cd frontend
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Run development server:**
   ```bash
   npm run dev
   ```

4. **Access the application:**
   Open [http://localhost:5173](http://localhost:5173)

## 🔐 Demo Credentials

| Role    | Email                | Password   |
|---------|----------------------|------------|
| Admin   | admin@civiclens.com  | admin123   |
| Officer | officer@civiclens.com| officer123 |
| Citizen | citizen@civiclens.com| citizen123 |

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - User login
- `POST /api/auth/refresh` - Refresh access token
- `GET /api/auth/me` - Get current user profile

### Complaints
- `POST /api/complaints` - Submit new complaint
- `GET /api/complaints` - Get complaints (filtered)
- `GET /api/complaints/:id` - Get complaint details
- `PUT /api/complaints/:id/status` - Update status
- `GET /api/complaints/nearby` - Get nearby complaints

### Admin
- `GET /api/admin/dashboard` - Dashboard statistics
- `GET /api/admin/users` - User management
- `GET /api/admin/heatmap` - Complaint heatmap data

### Analytics
- `GET /api/analytics/overview` - City overview
- `GET /api/analytics/trends` - Trend analysis
- `GET /api/analytics/categories` - Category breakdown
- `GET /api/analytics/hotspots` - Problem hotspots

## 🎨 Design System

The platform uses a modern, dark-themed design with:

- **Glass morphism** effects for cards
- **Gradient** accents and buttons
- **Smooth animations** and micro-interactions
- **Consistent spacing** and typography
- **Responsive** layouts for all screen sizes

### Color Palette
- Primary: `#3b82f6` (Blue)
- Accent: `#8b5cf6` (Purple)
- Success: `#10b981` (Green)
- Warning: `#f59e0b` (Amber)
- Error: `#ef4444` (Red)
- Background: `#0a0a0b` to `#0f0f14`

## 🔧 Configuration

### Backend Environment Variables

```env
FLASK_APP=run.py
FLASK_ENV=development
SECRET_KEY=your-secret-key
DATABASE_URL=postgresql://user:pass@localhost/civiclens
JWT_SECRET_KEY=your-jwt-secret
CORS_ORIGINS=http://localhost:5173
```

### Frontend Environment Variables

```env
VITE_API_URL=/api
```

## 📈 AI/ML Features

### Complaint Categorization
- TF-IDF vectorization of complaint text
- Logistic Regression classifier
- Keyword-based fallback for accuracy

### Severity Scoring
- Multi-factor analysis:
  - Urgency keywords (40%)
  - Category weights (25%)
  - Time sensitivity (20%)
  - Impact assessment (15%)

### Priority Assignment
- Critical: Score > 0.8 or critical keywords
- High: Score > 0.6
- Medium: Score > 0.4
- Low: Score <= 0.4

## 🧪 Testing

```bash
# Backend tests
cd backend
pytest

# Frontend tests
cd frontend
npm test
```

## 🐳 Docker Deployment

```bash
# Build and run all services
docker-compose up --build
```

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 👥 Team

Built with ❤️ for smarter cities.

---

**CivicLens** - *Transforming how cities listen to citizens*
