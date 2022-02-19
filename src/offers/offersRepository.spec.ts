import * as faker from 'faker';

import { Offer } from './offersEntity';

describe('offersRepository', () => {
  const mockDynamoPromise = jest.fn();
  const mockDynamoScan = jest.fn().mockReturnValue({ promise: mockDynamoPromise });
  const mockDynamoGet = jest.fn().mockReturnValue({ promise: mockDynamoPromise });

  jest.doMock('aws-sdk', () => ({
    DynamoDB: {
      DocumentClient: jest.fn().mockReturnValue({
        scan: mockDynamoScan,
        get: mockDynamoGet
      })
    }
  }));

  const offersRepository = require('./offersRepository');

  describe('index', () => {
    it('Should get offers', async () => {
      const items = [
        {
          id: faker.datatype.uuid(),
          name: faker.random.words(5),
          brandId: faker.datatype.uuid(),
          locationsTotal: faker.datatype.number(500)
        }
      ];

      mockDynamoPromise.mockResolvedValue({ Items: items });

      const offers = await offersRepository.index();

      expect(offers).toHaveLength(1);
      expect(offers[0]).toBeInstanceOf(Offer);
      expect(mockDynamoScan).toHaveBeenCalledWith({ TableName: offersRepository.TABLE_NAME });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });

    it('Should return an empty array if no item is found on the database', async () => {
      mockDynamoPromise.mockResolvedValue({ Items: undefined });

      const offers = await offersRepository.index();

      expect(offers).toHaveLength(0);
      expect(mockDynamoScan).toHaveBeenCalledWith({ TableName: offersRepository.TABLE_NAME });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const id = faker.datatype.uuid();

    it('Should find an offer based on the given id', async () => {
      const item = {
        id: faker.datatype.uuid(),
        name: faker.random.words(5),
        brandId: faker.datatype.uuid(),
        locationsTotal: faker.datatype.number(500)
      };

      mockDynamoPromise.mockResolvedValue({ Item: item });

      const offer = await offersRepository.findById(id);

      expect(offer).toBeInstanceOf(Offer);
      expect(offer).toEqual(item);
      expect(mockDynamoGet).toHaveBeenCalledWith({
        TableName: offersRepository.TABLE_NAME,
        Key: { id }
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });

    it('Should return undefined if no offer is found for the given id', async () => {
      mockDynamoPromise.mockResolvedValue({ Item: undefined });

      const offer = await offersRepository.findById(id);

      expect(offer).toBeUndefined();
      expect(mockDynamoGet).toHaveBeenCalledWith({
        TableName: offersRepository.TABLE_NAME,
        Key: { id }
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });
  });
});