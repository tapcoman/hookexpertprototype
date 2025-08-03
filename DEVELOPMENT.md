# Development Guide

## Project Architecture

### Tri-Modal Hook Generation

The core innovation of Hook Line Studio is its tri-modal approach to hook generation:

1. **Verbal Hook**: The spoken/written opening line
2. **Visual Hook**: First-frame visual suggestions
3. **Textual Hook**: On-screen text overlays

### Psychological Framework Integration

Based on extensive research, the platform uses a taxonomy of 24+ proven hook formulas organized into 5 categories:

- **Question-Based**: Leverages curiosity gaps
- **Statement-Based**: Uses authority and surprise
- **Narrative**: Exploits storytelling psychology
- **Urgency/Exclusivity**: Triggers FOMO and social proof
- **Efficiency**: Provides immediate value

### AI Integration Architecture

```typescript
// Master Prompt Blueprint
const MASTER_PROMPT = {
  persona: "HookBot - world-class viral video strategist",
  process: [
    "1. Analyze context (content type, objective)",
    "2. Select psychological strategy (Value Hit vs Curiosity Gap)",
    "3. Choose relevant hook categories",
    "4. Generate tri-modal concepts"
  ],
  output: "Complete multi-modal script for each concept"
}
```

## Development Workflow

### Phase 1: Foundation (Current)
- [x] Project structure setup
- [x] Database schema design
- [x] Basic server architecture
- [x] TypeScript configuration
- [x] Essential dependencies

### Phase 2: Core Features
- [ ] Firebase authentication integration
- [ ] Hook generation API
- [ ] OpenAI service implementation
- [ ] User onboarding flow
- [ ] Basic React components

### Phase 3: UI/UX Implementation
- [ ] Landing page
- [ ] Main application interface
- [ ] Mobile responsive design
- [ ] Radix UI component library
- [ ] Framer Motion animations

### Phase 4: Advanced Features
- [ ] Stripe payment integration
- [ ] Analytics and tracking
- [ ] A/B testing framework
- [ ] Performance optimization
- [ ] SEO implementation

### Phase 5: Quality Assurance
- [ ] Comprehensive testing
- [ ] Security audit
- [ ] Performance testing
- [ ] User acceptance testing
- [ ] Documentation completion

### Phase 6: Deployment
- [ ] Railway deployment setup
- [ ] Environment configuration
- [ ] Domain and SSL setup
- [ ] Monitoring and alerting
- [ ] Backup systems

### Phase 7: Post-Launch
- [ ] User feedback integration
- [ ] Feature iterations
- [ ] Scaling optimization
- [ ] Additional platform support
- [ ] Enterprise features

## Key Implementation Details

### Database Design Principles

1. **JSONB Storage**: Flexible hook data structure
2. **Indexing Strategy**: Optimized for user queries
3. **Audit Trail**: Track all user actions
4. **Scalability**: Prepared for millions of hooks

### API Design Patterns

1. **RESTful Endpoints**: Standard HTTP methods
2. **Zod Validation**: Type-safe request/response
3. **Error Handling**: Consistent error responses
4. **Rate Limiting**: Prevent abuse

### Frontend Architecture

1. **Component-Based**: Reusable UI components
2. **State Management**: React Query for server state
3. **Routing**: File-based routing with Wouter
4. **Styling**: Tailwind CSS with design system

### Security Considerations

1. **Authentication**: Firebase JWT tokens
2. **Authorization**: Role-based access control
3. **Input Validation**: Server-side validation
4. **Rate Limiting**: API protection
5. **CORS**: Proper origin restrictions

## Testing Strategy

### Unit Tests
- Utility functions
- Hook generation logic
- Database operations
- API endpoints

### Integration Tests
- Authentication flow
- Payment processing
- External API integration
- Database transactions

### E2E Tests
- User registration flow
- Hook generation process
- Payment subscription
- Mobile responsiveness

## Performance Optimization

### Frontend
- Code splitting by route
- Lazy loading components
- Image optimization
- Bundle size monitoring

### Backend
- Database query optimization
- Connection pooling
- Caching strategies
- Background job processing

### Infrastructure
- CDN for static assets
- Database read replicas
- Load balancing
- Monitoring and alerting

## Deployment Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Client (Vite)  │───▶│  Server (Node)  │───▶│ Database (PG)   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                                │
                                ▼
                       ┌─────────────────┐
                       │  External APIs  │
                       │  - OpenAI       │
                       │  - Firebase     │
                       │  - Stripe       │
                       └─────────────────┘
```

## Environment Setup Details

### Development Environment
```bash
# Install dependencies
npm install

# Setup environment variables
cp .env.example .env

# Start development servers
npm run dev
```

### Production Environment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## Code Style Guidelines

### TypeScript
- Strict mode enabled
- Explicit return types for functions
- Proper error handling
- Zod schemas for validation

### React
- Functional components with hooks
- Props interface definitions
- Error boundaries
- Accessibility considerations

### CSS
- Tailwind utility classes
- Component-based styling
- Responsive design patterns
- Dark mode support

## Troubleshooting

### Common Issues

1. **Database Connection**
   - Check DATABASE_URL environment variable
   - Verify PostgreSQL server is running
   - Run migrations: `npm run db:migrate`

2. **Build Errors**
   - Clear node_modules: `rm -rf node_modules && npm install`
   - Check TypeScript errors: `npm run type-check`
   - Verify all environment variables are set

3. **API Issues**
   - Check server logs for errors
   - Verify API keys are valid
   - Test endpoints with health check

### Debug Mode

Enable debug logging:
```bash
DEBUG=hook-line-studio:* npm run dev
```

## Monitoring and Analytics

### Performance Metrics
- Core Web Vitals
- API response times
- Database query performance
- User engagement metrics

### Error Tracking
- Client-side error boundaries
- Server-side error logging
- External service monitoring
- User feedback collection

## Contributing Guidelines

1. **Code Quality**
   - Run linting: `npm run lint`
   - Format code: `npm run format`
   - Type checking: `npm run type-check`

2. **Testing**
   - Write tests for new features
   - Maintain test coverage above 80%
   - Test mobile responsiveness

3. **Documentation**
   - Update README for new features
   - Document API changes
   - Add inline code comments

4. **Security**
   - No hardcoded secrets
   - Validate all inputs
   - Follow OWASP guidelines

This development guide provides the foundation for building Hook Line Studio with scalability, security, and maintainability in mind.
EOF < /dev/null