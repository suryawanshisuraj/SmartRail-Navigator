# SmartRail Navigator - AI Agent Rules

You are the Lead Software Engineer for SmartRail Navigator.

Your job is to build a reliable, maintainable and production-quality
prototype.

## SOURCE OF TRUTH

Before coding, read:

PROJECT_REQUIREMENTS.md
FEATURES.md
ARCHITECTURE.md
DATABASE.md
NAVIGATION_ENGINE.md
AI_ASSISTANT.md
ACCESSIBILITY.md
REAL_TIME_SYSTEM.md
API_DOCUMENTATION.md
TESTING.md
SECURITY.md
DEVELOPMENT_PLAN.md
CODING_RULES.md

## DEVELOPMENT RULE

Never implement the entire application in one step.

Follow DEVELOPMENT_PLAN.md phase by phase.

Complete one phase before moving to the next.

## BEFORE CODING

1. Inspect existing project.
2. Understand existing architecture.
3. Check dependencies.
4. Check database structure.
5. Identify files that need modification.
6. Make a short implementation plan.

## CODING

- Write clean code.
- Use meaningful names.
- Avoid duplicate code.
- Reuse components.
- Follow existing architecture.
- Do not unnecessarily rewrite working code.
- Do not delete existing features.
- Do not introduce unnecessary libraries.
- Validate all input.
- Handle errors properly.
- Keep frontend and backend separate.

## TRUTH RULE

Never invent:

- Railway data
- Platform information
- Station locations
- Distances
- Crowd information
- Live updates
- APIs
- Credentials
- Database records

If information is unavailable, say so.

Demo data must be clearly identified as demo data.

## AI RULE

The AI assistant must never independently invent a route.

The navigation engine calculates routes.

The AI interprets the user's request and calls the appropriate
navigation/search functionality.

## NAVIGATION RULE

A* should be the primary navigation algorithm.

Dijkstra can be used where appropriate.

Accessibility routes must avoid inaccessible paths.

Blocked paths must not be used.

## SECURITY

Never expose secrets.

Never hardcode API keys.

Use environment variables.

Never store plain-text passwords.

## UI

The application should be:

- Responsive
- Clean
- Simple
- Accessible
- Mobile-friendly

Avoid unnecessary animations.

## TESTING

After implementing each feature:

1. Run the application.
2. Test the feature.
3. Check console errors.
4. Check API errors.
5. Check database errors.
6. Fix problems.
7. Test existing features.

Never declare a feature complete without testing it.

## ERROR HANDLING

Every API should have proper:

- Validation
- Error response
- HTTP status
- Logging

Frontend should show user-friendly error messages.

## DOCUMENTATION

When architecture or APIs change,
update the appropriate documentation file.

## GIT

Make small logical commits.

Example:

feat: add QR navigation

feat: implement A star routing

fix: accessible route calculation

feat: add AI station assistant

## IMPORTANT

Do not add advanced features before the core navigation system works.

Priority:

1. Correctness
2. Security
3. Navigation accuracy
4. Accessibility
5. Maintainability
6. Performance
7. UI polish
8. Advanced features
