# Technical Research: Location-Based Check-In Controls

**Feature**: Location-Based Check-In Controls
**Branch**: `007-i-want-admin`
**Date**: 2025-09-26
**Status**: Research Complete

## Overview

Research findings for implementing location-based check-in controls in the Next.js/TypeScript time tracking application. This document resolves technical unknowns identified during feature specification and planning phases.

## 1. Browser Geolocation API Best Practices

### Decision
Use `navigator.geolocation.watchPosition()` with accuracy filtering instead of single `getCurrentPosition()` calls.

### Rationale
- Initial GPS readings often have poor accuracy (>100m)
- `watchPosition()` provides progressive accuracy improvement as GPS warms up
- Enables real-time accuracy filtering against 50m tolerance requirement
- Better user experience with immediate feedback on location quality

### Alternatives Considered
- **Single getCurrentPosition()**: Rejected due to poor initial accuracy and no improvement mechanism
- **Multiple getCurrentPosition() calls**: Rejected due to battery drain and complexity
- **Third-party location services**: Rejected due to privacy concerns and dependency overhead

### Implementation Pattern
```typescript
const watchOptions = {
  enableHighAccuracy: true,
  timeout: 10000,
  maximumAge: 60000
};

const watchId = navigator.geolocation.watchPosition(
  (position) => {
    if (position.coords.accuracy <= 50) {
      // Use high-accuracy position
    } else if (position.coords.accuracy <= 100) {
      // Use medium-accuracy with warning
    }
  },
  handleError,
  watchOptions
);
```

## 2. GPS Accuracy Handling (50m Tolerance)

### Decision
Implement progressive accuracy filtering with 50m target and 100m fallback thresholds.

### Rationale
- 50m accuracy balances location verification needs with device capabilities
- Fallback to 100m prevents blocking legitimate users with older devices
- Progressive approach provides clear user feedback on location quality
- Meets business requirement while maintaining usability

### Alternatives Considered
- **Strict 50m enforcement**: Rejected due to device limitations and user experience impact
- **Variable accuracy by device type**: Rejected due to complexity and inconsistent behavior
- **Network-based location fallback**: Rejected due to poor accuracy (>1km typical)

### Implementation Strategy
```typescript
enum LocationAccuracy {
  HIGH = 50,     // Preferred accuracy
  MEDIUM = 100,  // Acceptable with warning
  LOW = 500      // Reject or warning mode
}

function evaluateLocationAccuracy(accuracy: number) {
  if (accuracy <= LocationAccuracy.HIGH) return 'verified';
  if (accuracy <= LocationAccuracy.MEDIUM) return 'warning';
  return 'rejected';
}
```

## 3. Privacy-Compliant Location Verification

### Decision
Implement ephemeral verification with immediate coordinate disposal ("verify and discard" pattern).

### Rationale
- GDPR compliance through minimal data processing
- Eliminates location tracking concerns
- Reduces data breach risk
- Maintains user trust while meeting business needs
- Only verification result is retained, not coordinates

### Alternatives Considered
- **Coordinate storage with encryption**: Rejected due to GDPR complexity and breach risk
- **Hashed coordinate storage**: Rejected due to rainbow table vulnerabilities
- **Aggregated location analytics**: Rejected due to scope creep and privacy concerns

### Implementation Approach
```typescript
// Client-side verification
async function verifyLocation(userCoords: GeolocationCoordinates) {
  const verification = await verifyLocationServerSide({
    latitude: userCoords.latitude,
    longitude: userCoords.longitude,
    accuracy: userCoords.accuracy,
    groupId: currentGroup.id
  });

  // Coordinates never stored, only verification result
  return {
    verified: verification.success,
    accuracy: verification.accuracy,
    timestamp: new Date().toISOString()
  };
}
```

## 4. Supabase PostgreSQL Integration

### Decision
Use JSONB location policy storage in groups table with PostGIS spatial functions for server-side verification.

### Rationale
- PostGIS provides accurate distance calculations accounting for Earth curvature
- JSONB storage keeps location policy flexible and schema-light
- Server-side verification prevents client tampering
- Leverages existing Supabase infrastructure
- RLS policies can control access to location settings

### Alternatives Considered
- **Separate location_policies table**: Rejected due to over-normalization for single location per group
- **Client-side verification only**: Rejected due to security concerns
- **Third-party geofencing service**: Rejected due to cost and external dependency

### Database Schema Extension
```sql
-- Add location policy to existing groups table
ALTER TABLE groups
ADD COLUMN location_policy JSONB;

-- Example policy structure
{
  "enabled": true,
  "center": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "radius_meters": 50,
  "enforcement_mode": "strict" // or "permissive"
}

-- Server-side verification function
CREATE OR REPLACE FUNCTION verify_location(
  user_lat FLOAT,
  user_lng FLOAT,
  group_id UUID
) RETURNS JSONB AS $$
-- Implementation with PostGIS distance calculation
$$;
```

## 5. Error Handling for Location Service Failures

### Decision
Implement graceful degradation with warning flags and permissive fallback mode.

### Rationale
- Maintains application usability when location services fail
- Provides audit trail for compliance and debugging
- Gives administrators visibility into location verification issues
- Balances security requirements with user experience

### Alternatives Considered
- **Strict enforcement (block on failure)**: Rejected due to user experience impact
- **Silent failures**: Rejected due to audit and compliance requirements
- **Manual override only**: Rejected due to administrative overhead

### Error Hierarchy
```typescript
enum LocationVerificationResult {
  VERIFIED = 'verified',           // Within 50m boundary
  WARNING_ACCURACY = 'warning',    // 50-100m accuracy
  WARNING_UNAVAILABLE = 'unavailable', // GPS/permissions denied
  WARNING_TIMEOUT = 'timeout',     // Location request timeout
  REJECTED = 'rejected'            // Outside boundary
}

// Check-in record includes verification status
interface CheckInRecord {
  // ... other fields
  location_verification: LocationVerificationResult;
  location_accuracy?: number;
  verification_timestamp: string;
}
```

## 6. Performance Optimization (<200ms Target)

### Decision
Implement dual-strategy approach: fast response with background accurate verification.

### Rationale
- Immediate user feedback within 200ms prevents perceived lag
- Background verification provides accurate results for audit
- Caching reduces repeated location requests for same session
- Progressive accuracy improvement enhances user experience

### Alternatives Considered
- **Synchronous verification only**: Rejected due to timeout risks and poor UX
- **Cached location only**: Rejected due to accuracy degradation over time
- **Network location fallback**: Rejected due to poor accuracy for 50m requirements

### Implementation Strategy
```typescript
// Fast response with background verification
async function performLocationVerification() {
  const quickCheck = await Promise.race([
    getCurrentLocationQuick(),
    new Promise(resolve => setTimeout(() => resolve(null), 200))
  ]);

  if (quickCheck) {
    // Fast path: return immediate result
    backgroundAccurateVerification(); // Fire and forget
    return quickCheck;
  }

  // Fallback: show loading, wait for accurate result
  return await getAccurateLocation();
}

// Session-based caching
const locationCache = {
  lastVerification: null,
  ttl: 60000, // 1 minute
  isValid: () => Date.now() - this.lastVerification?.timestamp < this.ttl
};
```

## Implementation Readiness

All technical unknowns have been resolved with specific implementation approaches:

1. ✅ **Browser API Strategy**: watchPosition() with accuracy filtering
2. ✅ **Accuracy Handling**: 50m target, 100m fallback, progressive filtering
3. ✅ **Privacy Compliance**: Ephemeral verification, no coordinate storage
4. ✅ **Database Integration**: JSONB policies with PostGIS verification
5. ✅ **Error Handling**: Graceful degradation with audit trail
6. ✅ **Performance**: <200ms fast path with background accurate verification

## Next Phase

Ready to proceed to Phase 1: Design data model, API contracts, and quickstart documentation based on these research findings.