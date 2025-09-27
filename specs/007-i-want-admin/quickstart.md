# Quickstart: Location-Based Check-In Controls

**Feature**: Location-Based Check-In Controls
**Branch**: `007-i-want-admin`
**Date**: 2025-09-26
**Status**: Ready for Implementation

## Overview

This quickstart guide validates the location-based check-in controls feature through key user scenarios. It serves as both implementation validation and user acceptance testing documentation.

## Prerequisites

- Time Tracker application running locally
- Supabase database with groups and time_entries tables
- User account with group administrator privileges
- Device with location services enabled
- Modern browser supporting Geolocation API

## Test Scenarios

### Scenario 1: Administrator Sets Up Location Policy

**Goal**: Verify admins can configure location restrictions for their groups

**Steps**:
1. **Login** as group administrator
2. **Navigate** to Groups page (`/dashboard/groups`)
3. **Select** target group from list
4. **Access** group settings/configuration
5. **Enable** location-based check-in controls
6. **Set location** using current device position or map interface
7. **Configure** radius (default: 50 meters)
8. **Select** enforcement mode:
   - `strict`: Block check-ins outside boundary
   - `permissive`: Allow with warning (recommended)
9. **Save** policy configuration

**Expected Results**:
- ✅ Location policy saved to `groups.location_policy` JSONB column
- ✅ Policy immediately active for group members
- ✅ Group members see location requirement notification
- ✅ Admin can modify/disable policy later

**API Validation**:
```http
PUT /api/v1/groups/{groupId}/location-policy
{
  "enabled": true,
  "center": {
    "latitude": 40.7128,
    "longitude": -74.0060
  },
  "radius_meters": 50,
  "enforcement_mode": "permissive"
}
```

### Scenario 2: Successful Location-Verified Check-In

**Goal**: Verify team members can check in when at authorized location

**Steps**:
1. **Login** as team member of location-restricted group
2. **Navigate** to Dashboard (`/dashboard`)
3. **Ensure** device is within 50m of configured location
4. **Click** "Clock In" button
5. **Grant** location permission when prompted
6. **Wait** for location verification (< 5 seconds)
7. **Verify** check-in success with location confirmation

**Expected Results**:
- ✅ Browser requests location permission
- ✅ GPS coordinates obtained within 200ms (fast path)
- ✅ Location verified against group policy
- ✅ Check-in recorded with `verified` status
- ✅ User sees success message with location confirmation
- ✅ Session timer begins

**API Validation**:
```http
POST /api/v1/time/checkin
{
  "group_id": "uuid-here",
  "location": {
    "latitude": 40.7128,
    "longitude": -74.0060,
    "accuracy": 15
  }
}

Response:
{
  "entry": { ... },
  "location_verification": {
    "status": "verified",
    "accuracy_meters": 15,
    "enforcement_mode": "permissive",
    "verification_timestamp": "2025-09-26T10:00:00Z"
  }
}
```

### Scenario 3: Check-In Outside Authorized Location

**Goal**: Verify system properly handles location violations

**Steps**:
1. **Login** as team member of location-restricted group
2. **Navigate** to Dashboard (`/dashboard`)
3. **Ensure** device is >50m from configured location
4. **Click** "Clock In" button
5. **Grant** location permission when prompted
6. **Observe** location verification failure

**Expected Results for Strict Mode**:
- ❌ Check-in blocked with clear error message
- ❌ User shown distance from authorized location
- ❌ Guidance provided on how to check in properly
- ❌ No time entry created

**Expected Results for Permissive Mode**:
- ⚠️ Check-in allowed with warning notification
- ⚠️ Warning flag recorded in location verification
- ⚠️ User notified of location policy violation
- ✅ Time entry created with `warning` status

**API Validation**:
```http
POST /api/v1/time/checkin
{
  "group_id": "uuid-here",
  "location": {
    "latitude": 40.7200,  // Outside boundary
    "longitude": -74.0060,
    "accuracy": 20
  }
}

Response (Strict Mode):
{
  "error": "outside_boundary",
  "message": "Check-in location is outside authorized area",
  "location_policy": {
    "radius_meters": 50,
    "enforcement_mode": "strict"
  }
}

Response (Permissive Mode):
{
  "entry": { ... },
  "location_verification": {
    "status": "warning",
    "distance_from_center": 150
  },
  "warnings": ["Check-in location outside authorized area"]
}
```

### Scenario 4: Check-In with Location Services Disabled

**Goal**: Verify graceful handling when location is unavailable

**Steps**:
1. **Disable** location services in browser settings
2. **Login** as team member of location-restricted group
3. **Navigate** to Dashboard (`/dashboard`)
4. **Click** "Clock In" button
5. **Deny** location permission when prompted (or already disabled)

**Expected Results**:
- ⚠️ Check-in allowed with warning in permissive mode
- ⚠️ Warning message about location verification failure
- ⚠️ Time entry created with `unavailable` status
- ✅ User can still work but admin gets compliance visibility

**API Validation**:
```http
POST /api/v1/time/checkin
{
  "group_id": "uuid-here"
  // No location data provided
}

Response:
{
  "entry": { ... },
  "location_verification": {
    "status": "unavailable",
    "error_reason": "location_permission_denied",
    "enforcement_mode": "permissive"
  },
  "warnings": ["Location verification unavailable - check-in allowed"]
}
```

### Scenario 5: Location Policy Management

**Goal**: Verify admins can modify and disable location policies

**Steps**:
1. **Login** as group administrator
2. **Navigate** to group with existing location policy
3. **Access** location policy settings
4. **Modify** policy radius from 50m to 100m
5. **Save** changes
6. **Test** check-in at 75m distance (should now work)
7. **Disable** entire location policy
8. **Verify** normal check-ins work without location verification

**Expected Results**:
- ✅ Policy changes take effect immediately
- ✅ Existing sessions unaffected by policy changes
- ✅ New check-ins use updated policy
- ✅ Disabled policy allows normal check-ins
- ✅ Historical verification data preserved

## Performance Validation

### Response Time Tests

**Location Verification Speed**:
- ✅ Initial response < 200ms (fast path)
- ✅ Accurate verification < 5 seconds (background)
- ✅ Total check-in flow < 10 seconds

**Database Performance**:
- ✅ Policy lookup < 50ms
- ✅ Verification logging < 100ms
- ✅ Concurrent check-ins handle 10+ users

### Accuracy Tests

**GPS Accuracy Handling**:
- ✅ 15m accuracy: Always accepted
- ✅ 40m accuracy: Accepted with confidence
- ✅ 75m accuracy: Warning mode with notification
- ✅ 150m accuracy: Rejected or warning based on mode

## Security Validation

### Privacy Compliance

**Data Minimization**:
- ✅ GPS coordinates never persisted to database
- ✅ Only verification results stored
- ✅ Location data cleared from memory after verification
- ✅ No location tracking or history beyond verification

**Access Controls**:
- ✅ Only group admins can set/modify location policies
- ✅ Group members can view but not modify policies
- ✅ Non-members cannot access location policy data
- ✅ API endpoints properly enforce permissions

## Rollback Plan

If issues arise during implementation:

1. **Disable feature flags** in application configuration
2. **Set all location policies** to `disabled` via database update
3. **Remove location verification** from check-in flow
4. **Preserve historical data** for future debugging
5. **Monitor error logs** for location service failures

```sql
-- Emergency disable all location policies
UPDATE groups
SET location_policy = jsonb_set(location_policy, '{enabled}', 'false')
WHERE location_policy->>'enabled' = 'true';
```

## Success Criteria

This feature is ready for production when:

- [ ] All 5 test scenarios pass consistently
- [ ] Performance meets < 200ms fast response target
- [ ] Location accuracy handling works across device types
- [ ] Privacy compliance verified (no coordinate storage)
- [ ] Admin interface usable without technical knowledge
- [ ] Error messages are clear and actionable
- [ ] Graceful degradation works when location unavailable
- [ ] Database migrations complete without data loss
- [ ] API contracts match implementation
- [ ] Documentation complete for users and administrators

## Post-Launch Monitoring

**Key Metrics to Track**:
- Location verification success rate
- Average response time for location checks
- Policy violation frequency by group
- User adoption of location-restricted groups
- Error rates for location service failures

**Alert Thresholds**:
- Location verification failure rate > 20%
- Average response time > 500ms
- GPS accuracy worse than 100m for >30% of requests
- Policy violation rate > 50% (may indicate incorrect configuration)

This quickstart provides comprehensive validation of the location-based check-in controls feature and serves as acceptance criteria for implementation completion.