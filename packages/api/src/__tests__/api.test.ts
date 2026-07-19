import { describe, it, expect } from "vitest";

const API_URL = process.env.API_URL || "http://localhost:3000";

describe("Health", () => {
  it("GET /api/health returns ok", async () => {
    const res = await fetch(`${API_URL}/api/health`);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.status).toBe("ok");
  });
});

describe("Auth", () => {
  const testUser = {
    name: "Test User",
    email: `test_${Date.now()}@kospintar.com`,
    password: "Test1234",
    phone: "6281234567890",
  };
  let token: string;

  it("POST /api/auth/register creates account", async () => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    expect(data.token).toBeTruthy();
    token = data.token;
  });

  it("POST /api/auth/login returns JWT", async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: testUser.email, password: testUser.password }),
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.token).toBeTruthy();
  });

  it("POST /api/auth/register rejects duplicate email", async () => {
    const res = await fetch(`${API_URL}/api/auth/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(testUser),
    });
    expect(res.status).toBe(409);
  });

  it("GET /api/auth/me returns profile", async () => {
    const res = await fetch(`${API_URL}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.user.email).toBe(testUser.email);
  });
});

describe("Properties", () => {
  let token: string;
  let propertyId: string;

  beforeAll(async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@kospintar.com", password: "Kospintar1" }),
    });
    const data = await res.json();
    token = data.token;
  });

  it("GET /api/properties returns list", async () => {
    const res = await fetch(`${API_URL}/api/properties`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.data)).toBe(true);
  });

  it("POST /api/properties creates property", async () => {
    const res = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Test Kos", address: "Jl. Test", total_rooms: 3 }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    propertyId = data.property.id;
  });

  it("GET /api/properties/:id returns details", async () => {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("DELETE /api/properties/:id soft deletes", async () => {
    const res = await fetch(`${API_URL}/api/properties/${propertyId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});

describe("Tenants", () => {
  let token: string;
  let propertyId: string;
  let tenantId: string;

  beforeAll(async () => {
    const loginRes = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@kospintar.com", password: "Kospintar1" }),
    });
    const loginData = await loginRes.json();
    token = loginData.token;

    const propRes = await fetch(`${API_URL}/api/properties`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ name: "Tenant Test Kos", address: "Jl. Tenant", total_rooms: 5 }),
    });
    const propData = await propRes.json();
    propertyId = propData.property.id;
  });

  it("POST /api/tenants creates tenant", async () => {
    const res = await fetch(`${API_URL}/api/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        property_id: propertyId,
        name: "Tenant Test",
        phone: "6281212345678",
        room_number: "T01",
        rent_amount: 1_500_000,
        contract_start: "2026-01-01",
        contract_end: "2026-12-31",
      }),
    });
    expect(res.status).toBe(201);
    const data = await res.json();
    tenantId = data.tenant.id;
  });

  it("GET /api/tenants returns list with tenant", async () => {
    const res = await fetch(`${API_URL}/api/tenants?property_id=${propertyId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });

  it("POST /api/tenants rejects duplicate room", async () => {
    const res = await fetch(`${API_URL}/api/tenants`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        property_id: propertyId,
        name: "Duplicate Room",
        phone: "6281298765432",
        room_number: "T01",
        rent_amount: 1_500_000,
        contract_start: "2026-01-01",
        contract_end: "2026-12-31",
      }),
    });
    expect(res.status).toBe(409);
  });

  it("DELETE /api/tenants/:id checkouts tenant", async () => {
    const res = await fetch(`${API_URL}/api/tenants/${tenantId}`, {
      method: "DELETE",
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});

describe("Bills", () => {
  let token: string;

  beforeAll(async () => {
    const res = await fetch(`${API_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "owner@kospintar.com", password: "Kospintar1" }),
    });
    const data = await res.json();
    token = data.token;
  });

  it("GET /api/bills returns list", async () => {
    const res = await fetch(`${API_URL}/api/bills`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(Array.isArray(data.data)).toBe(true);
  });
});
