# API Documentation

## Base URL

```
http://localhost:3000/api
```

## Authentication

Most endpoints require authentication using JWT Bearer token.

Add to request headers:

```
Authorization: Bearer <your_access_token>
```

---

## 🔐 Authentication Endpoints

### Register User

```http
POST /auth/register
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!",
  "role": "employee" // Optional: defaults to "employee"
}
```

**Response (201):**

```json
{
  "success": true,
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "employee"
  },
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

### Login

```http
POST /auth/login
```

**Request Body:**

```json
{
  "email": "user@example.com",
  "password": "StrongPass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc...",
  "user": {
    "id": 1,
    "email": "user@example.com",
    "role": "employee"
  }
}
```

### Change Password

```http
POST /auth/change-password
```

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "currentPassword": "OldPass123!",
  "newPassword": "NewPass123!"
}
```

**Response (200):**

```json
{
  "success": true,
  "message": "Password updated successfully"
}
```

### Refresh Token

```http
POST /auth/refresh-token
```

**Request Body:**

```json
{
  "refreshToken": "eyJhbGc..."
}
```

**Response (200):**

```json
{
  "success": true,
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..."
}
```

---

## 👤 Employee Endpoints

### Create Employee

```http
POST /employees
```

**Headers Required:** `Authorization: Bearer <token>`  
**Required Role:** HR

**Request Body:**

```json
{
  "empId": "EMP001",
  "salutation": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "dateOfBirth": "1990-01-01",
  "gender": "Male",
  "maritalStatus": "Single"
}
```

**Response (201):**

```json
{
  "id": 1,
  "empId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### Get All Employees

```http
GET /employees
```

**Query Parameters:**

- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response (200):**

```json
{
  "data": [{
    "id": 1,
    "empId": "EMP001",
    "firstName": "John",
    "lastName": "Doe",
    ...
  }],
  "pagination": {
    "current": 1,
    "total": 5
  }
}
```

### Get Employee by ID

```http
GET /employees/:id
```

**Headers Required:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "id": 1,
  "empId": "EMP001",
  "firstName": "John",
  "lastName": "Doe",
  ...
}
```

### Update Employee

```http
PATCH /employees/:id
```

**Headers Required:** `Authorization: Bearer <token>`  
**Required Role:** HR

**Request Body:**

```json
{
  "firstName": "John",
  "lastName": "Smith",
  ...
}
```

**Response (200):**

```json
{
  "id": 1,
  "firstName": "John",
  "lastName": "Smith",
  ...
}
```

### Delete Employee

```http
DELETE /employees/:id
```

**Headers Required:** `Authorization: Bearer <token>`  
**Required Role:** HR

**Response (204):** No content

---

## 📝 Leave Management

### Apply for Leave

```http
POST /leave
```

**Headers Required:** `Authorization: Bearer <token>`

**Request Body:**

```json
{
  "employeeId": 1,
  "startDate": "2025-02-10",
  "endDate": "2025-02-12",
  "leaveType": "PL",
  "reason": "Family vacation"
}
```

**Response (201):**

```json
{
  "id": 1,
  "employeeId": 1,
  "startDate": "2025-02-10",
  "endDate": "2025-02-12",
  "leaveType": "PL",
  "status": "PENDING",
  ...
}
```

### Get Leave Applications

```http
GET /leave
```

**Headers Required:** `Authorization: Bearer <token>`

**Response (200):**

```json
{
  "data": [{
    "id": 1,
    "employeeId": 1,
    "startDate": "2025-02-10",
    "endDate": "2025-02-12",
    "leaveType": "PL",
    "status": "PENDING",
    ...
  }]
}
```

### Update Leave Status

```http
PATCH /leave/:id/status
```

**Headers Required:** `Authorization: Bearer <token>`  
**Required Role:** HR or MANAGER

**Request Body:**

```json
{
  "status": "APPROVED" // or "REJECTED"
}
```

**Response (200):**

```json
{
  "id": 1,
  "status": "APPROVED",
  ...
}
```

---

## 👥 Candidate Management

### Verify Candidate

```http
POST /candidates/verify
```

**Request Body:**

```json
{
  "email": "candidate@example.com"
}
```

**Response (200):**

```json
{
  "success": true,
  "isNewCandidate": true,
  "data": null
}
```

### Register Candidate

```http
POST /candidates/register
```

**Request Body:**

```json
{
  "salutation": "Mr",
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "dateOfBirth": "1990-01-01",
  "maritalStatus": "Single",
  "currentAddress": "123 Street",
  "permanentAddress": "123 Street",
  "postApplied": "Software Engineer"
}
```

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": 1,
    "firstName": "John",
    "lastName": "Doe",
    ...
  }
}
```

### Add Qualification

```http
POST /candidates/:candidateId/qualifications
```

**Request Body:**

```json
{
  "degree": "Bachelor of Technology",
  "yearOfPassing": "2020",
  "boardUniversity": "Example University",
  "marksObtained": "85%"
}
```

### Add Experience

```http
POST /candidates/:candidateId/experience
```

**Request Body:**

```json
{
  "organizationName": "Tech Corp",
  "designation": "Software Engineer",
  "period": "2020-2023",
  "ctc": 75000,
  "workLocation": "New York"
}
```

### Add Reference

```http
POST /candidates/:candidateId/references
```

**Request Body:**

```json
{
  "name": "Jane Smith",
  "designation": "Manager",
  "company": "Tech Corp",
  "contactNumber": "1234567890"
}
```

---

## 🏥 Health Check

### Check API Health

```http
GET /health
```

**Response (200):**

```json
{
  "status": "healthy",
  "timestamp": "2025-02-07T12:00:00.000Z",
  "services": {
    "api": "up",
    "database": "up"
  },
  "version": "1.0.0"
}
```

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**

```json
{
  "success": false,
  "message": "Invalid authentication token"
}
```

**403 Forbidden:**

```json
{
  "success": false,
  "message": "You don't have permission to access this resource"
}
```

**500 Server Error:**

```json
{
  "success": false,
  "message": "Internal server error message"
}
```
