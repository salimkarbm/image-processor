import request from 'supertest';
import app from '../app';
// import { AppDataSource } from '../database/typeOrm.config';

describe('App', () => {
  // beforeEach(() => {
  //     jest.resetAllMocks();
  // });
  // beforeAll(async () => {
  //     await AppDataSource.initialize();
  // });
  it('should be defined', () => {
    expect(app).toBeDefined();
  });
  it('should be a function', () => {
    expect(typeof app).toBe('function');
  });

  it('should return 200', async () => {
    const response = await request(app).get('/');
    expect(response.status).toBe(200);
  });

  afterAll(async () => {
    // await AppDataSource.destroy();
    app.listen().close();
  });
});
