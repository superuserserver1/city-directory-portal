---
Task ID: 2-a
Agent: Backend API Builder
Task: Build all API routes and authentication

Work Log:
- Created `src/lib/auth.ts` with JWT auth utilities (hashPassword, verifyPassword, generateToken, verifyToken, extractUserFromRequest, getDbUser, role helpers)
- Created auth routes: POST /api/auth/register, POST /api/auth/login, GET /api/auth/me
- Created categories routes: GET/POST /api/categories, PUT/DELETE /api/categories/[id]
- Created localities routes: GET/POST /api/localities, PUT/DELETE /api/localities/[id]
- Created businesses routes: GET/POST /api/businesses (with search/filter/pagination), GET/PUT/DELETE /api/businesses/[id]
- Created business products routes: GET/POST /api/businesses/[id]/products
- Created products routes: PUT/DELETE /api/products/[id]
- Created enquiries routes: GET/POST /api/enquiries (role-based filtering), GET/PUT /api/enquiries/[id]
- Created enquiry messages routes: GET/POST /api/enquiries/[id]/messages
- Created users routes: GET /api/users (admin), PUT/DELETE /api/users/[id] (admin)
- Created admin stats route: GET /api/stats
- Created seed route: GET /api/seed (idempotent, creates 4 users, 8 categories, 6 localities, 14 businesses, 33 products, 3 enquiries with messages)
- Removed old placeholder /api/route.ts
- ESLint passes with zero errors

Stage Summary:
- 18 API route files created covering all required endpoints
- JWT-based authentication with bcryptjs password hashing
- Role-based access control (ADMIN, BUSINESS_OWNER, VISITOR) enforced on all mutation endpoints
- Public read access for categories, localities, and business listings
- Comprehensive seed data with 14 businesses including 4 amenities and rich product/service data
- All routes use Next.js 16 App Router pattern with proper error handling