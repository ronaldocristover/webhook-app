import { describe, test, expect, beforeAll, afterAll } from 'bun:test';
import { closeDb } from '../db/db';

const BASE_URL = process.env.TEST_BASE_URL || 'http://localhost:3001';
const TEST_UUID = 'e2e-test-uuid-' + Date.now();

describe('Webhook Service E2E Tests', () => {
    beforeAll(async () => {
        // Tests initialized
    });

    afterAll(async () => {
        await closeDb();
    });

    describe('GET Requests', () => {
        test('should handle GET request without body', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-get`);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('GET');
            expect(data.webhook_uuid).toBe(`${TEST_UUID}-get`);
        });

        test('should handle GET request with query parameters', async () => {
            const queryParams = new URLSearchParams({ param1: 'value1', param2: 'value2' }).toString();
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-get-query?${queryParams}`);
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('GET');
        });
    });

    describe('POST Requests', () => {
        test('should handle POST request with JSON body', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-post`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ message: 'test', data: { id: 123 } }),
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('POST');
            expect(data.webhook_uuid).toBe(`${TEST_UUID}-post`);
        });

        test('should handle POST request with form data', async () => {
            const formData = new URLSearchParams({ name: 'test', age: '25' });

            const response = await fetch(`${BASE_URL}/${TEST_UUID}-post-form`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: formData.toString(),
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('POST');
        });

        test('should handle POST request with plain text body', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-post-text`, {
                method: 'POST',
                headers: { 'Content-Type': 'text/plain' },
                body: 'simple text data',
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('POST');
        });
    });

    describe('PUT Requests', () => {
        test('should handle PUT request with JSON body', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-put`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: 1, name: 'updated' }),
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('PUT');
            expect(data.webhook_uuid).toBe(`${TEST_UUID}-put`);
        });
    });

    describe('PATCH Requests', () => {
        test('should handle PATCH request with JSON body', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-patch`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'active' }),
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('PATCH');
            expect(data.webhook_uuid).toBe(`${TEST_UUID}-patch`);
        });
    });

    describe('DELETE Requests', () => {
        test('should handle DELETE request', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-delete`, {
                method: 'DELETE',
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
            expect(data.method).toBe('DELETE');
            expect(data.webhook_uuid).toBe(`${TEST_UUID}-delete`);
        });
    });

    describe('Custom Headers', () => {
        test('should capture custom headers', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-headers`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Custom-Header': 'custom-value',
                    'Authorization': 'Bearer token123',
                },
                body: JSON.stringify({ test: 'data' }),
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
        });
    });

    describe('IP Detection', () => {
        test('should detect IP address from headers', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-ip`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Forwarded-For': '192.168.1.100',
                },
                body: JSON.stringify({ test: 'ip detection' }),
            });
            const data = await response.json();

            expect(response.status).toBe(201);
            expect(data.success).toBe(true);
        });
    });

    describe('Error Handling', () => {
        test('should handle invalid JSON gracefully', async () => {
            const response = await fetch(`${BASE_URL}/${TEST_UUID}-invalid-json`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: 'invalid json {',
            });

            // Should still return 201 but with parsed error
            expect(response.status).toBe(201);
            const data = await response.json();
            expect(data.success).toBe(true);
        });
    });

    describe('Concurrent Requests', () => {
        test('should handle multiple concurrent requests', async () => {
            const promises = Array.from({ length: 5 }, (_, i) =>
                fetch(`${BASE_URL}/${TEST_UUID}-concurrent-${i}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ index: i }),
                })
            );

            const responses = await Promise.all(promises);
            responses.forEach((response) => {
                expect(response.status).toBe(201);
            });
        });
    });
});

