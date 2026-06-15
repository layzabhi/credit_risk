# Credit Risk Dashboard - Frontend

AI-powered credit risk assessment and management dashboard built with React, Vite, and Tailwind CSS.

## Features

- **Real-time Scoring**: Score credit applications instantly
- **Batch Processing**: Process multiple applications in bulk
- **Model Explainability**: Understand model decisions with SHAP explanations
- **Governance**: Audit trails and compliance tracking
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Framework**: React 18
- **Build Tool**: Vite
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **Routing**: React Router v6
- **HTTP Client**: Axios
- **Icons**: Lucide React
- **Testing**: Vitest + React Testing Library
- **Linting**: ESLint

## Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0 (or yarn/pnpm)

## Installation

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

4. Configure environment variables in `.env`:
```env
VITE_API_BASE_URL=http://localhost:8000
VITE_API_TIMEOUT=30000
```

## Development

Start the development server:

```bash
npm run dev
```

The application will be available at `http://localhost:3000`

### Other Commands

- **Build**: `npm run build` - Create production build
- **Preview**: `npm run preview` - Preview production build locally
- **Lint**: `npm run lint` - Run ESLint
- **Test**: `npm run test` - Run tests with Vitest

## Project Structure

```
src/
├── components/       # Reusable UI components
├── pages/           # Page components (Dashboard, Scoring, Batch, etc.)
├── context/         # React Context (Authentication, etc.)
├── hooks/           # Custom React hooks
├── services/        # API services and utilities
├── styles/          # Global styles and Tailwind config
├── utils/           # Utility functions
├── App.jsx          # Main app component
└── index.jsx        # React entry point
```

## Key Components

### Pages
- **DashboardPage**: Main overview with key metrics
- **ScoringPage**: Single application scoring interface
- **BatchPage**: Bulk application processing
- **GovernancePage**: Audit logs and compliance
- **SettingsPage**: Application settings

### Components
- **Navbar**: Top navigation bar
- **Sidebar**: Side navigation menu
- **ScoringForm**: Form for credit application inputs
- **ScoringResult**: Result display with explanations
- **BatchUpload**: CSV file upload interface
- **BatchResults**: Results table and export
- **ExplainabilityPanel**: SHAP explanations visualization
- **AuditLog**: Governance and audit trail
- **ModelRegistry**: Model versioning and deployment

## API Integration

The frontend communicates with the backend API at `http://localhost:8000/api`

### Available Endpoints

- `POST /api/v1/score` - Single application scoring
- `POST /api/v1/batch/upload` - Batch processing
- `GET /api/v1/batch/{job_id}` - Get batch job status
- `GET /api/v1/models` - List available models
- `GET /api/v1/audit-log` - Governance audit logs

See [backend documentation](../DEPLOYMENT.md) for full API specifications.

## Authentication

The frontend includes an authentication context that integrates with the backend. 

Configure authentication in `.env`:
```env
VITE_AUTH_ENABLED=true
VITE_SESSION_TIMEOUT=1800000  # 30 minutes
```

## Performance Optimization

- Code splitting with Vite
- Lazy loading of routes
- Image optimization
- CSS minification
- Bundle size monitoring

## Browser Support

- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Troubleshooting

### Port Already in Use
If port 3000 is already in use:
```bash
npm run dev -- --port 3001
```

### Build Issues
Clear cache and reinstall dependencies:
```bash
rm -rf node_modules dist
npm install
npm run build
```

### API Connection Issues
Ensure the backend is running on `http://localhost:8000`:
```bash
# Backend setup
cd ../backend
python -m uvicorn app.main:app --reload
```

## Deployment

### Docker

Build the Docker image:
```bash
docker build -t credit-risk-frontend:latest .
```

Run the container:
```bash
docker run -p 3000:3000 credit-risk-frontend:latest
```

### Production Build

```bash
npm run build
npm run preview
```

## Contributing

1. Create a feature branch: `git checkout -b feature/amazing-feature`
2. Commit changes: `git commit -m 'Add amazing feature'`
3. Push to branch: `git push origin feature/amazing-feature`
4. Open a Pull Request

## Code Style

- Use functional components with hooks
- Follow ESLint rules (run `npm run lint`)
- Use meaningful variable names
- Add JSDoc comments for complex functions

## License

This project is proprietary and confidential.

## Support

For issues and questions, please contact the development team.
