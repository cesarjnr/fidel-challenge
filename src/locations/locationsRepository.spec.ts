import * as faker from 'faker';

import { Location } from './locationsEntity';

describe('locationsRepository', () => {
  const mockDynamoPromise = jest.fn();
  const mockDynamoScan = jest.fn().mockReturnValue({ promise: mockDynamoPromise });
  const mockDynamoGet = jest.fn().mockReturnValue({ promise: mockDynamoPromise });
  const mockDynamoQuery = jest.fn().mockReturnValue({ promise: mockDynamoPromise });

  jest.doMock('aws-sdk', () => ({
    DynamoDB: {
      DocumentClient: jest.fn().mockReturnValue({
        scan: mockDynamoScan,
        get: mockDynamoGet,
        query: mockDynamoQuery
      })
    }
  }));

  const locationsRepository = require('./locationsRepository');

  describe('index', () => {
    it('Should get locations', async () => {
      const items = [
        {
          id: faker.datatype.uuid(),
          address: faker.address.streetAddress(),
          brandId: faker.datatype.uuid(),
          hasOffer: 1,
          offerId: faker.datatype.uuid()
        },
        {
          id: faker.datatype.uuid(),
          address: faker.address.streetAddress(),
          brandId: faker.datatype.uuid(),
          hasOffer: 0
        }
      ];

      mockDynamoPromise.mockResolvedValue({ Items: items });

      const locations = await locationsRepository.index();

      expect(locations).toHaveLength(2);
      expect(locations[0]).toBeInstanceOf(Location);
      expect(locations[1]).toBeInstanceOf(Location);
      expect(mockDynamoScan).toHaveBeenCalledWith({ TableName: locationsRepository.TABLE_NAME });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });

    it('Should return an empty array if no item is found on the database', async () => {
      mockDynamoPromise.mockResolvedValue({ Items: undefined });

      const locations = await locationsRepository.index();

      expect(locations).toHaveLength(0);
      expect(mockDynamoScan).toHaveBeenCalledWith({ TableName: locationsRepository.TABLE_NAME });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });
  });

  describe('findById', () => {
    const id = faker.datatype.uuid();

    it('Should find a location based on the given id', async () => {
      const item = {
        id,
        address: faker.address.streetAddress(),
        brandId: faker.datatype.uuid(),
        hasOffer: 1,
        offerId: faker.datatype.uuid()
      };

      mockDynamoPromise.mockResolvedValue({ Item: item });

      const location = await locationsRepository.findById(id);

      expect(location).toBeInstanceOf(Location);
      expect(location).toEqual(item);
      expect(mockDynamoGet).toHaveBeenCalledWith({
        TableName: locationsRepository.TABLE_NAME,
        Key: { id }
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });

    it('Should return undefined if no location is found for the given id', async () => {
      mockDynamoPromise.mockResolvedValue({ Item: undefined });

      const location = await locationsRepository.findById(id);

      expect(location).toBeUndefined();
      expect(mockDynamoGet).toHaveBeenCalledWith({
        TableName: locationsRepository.TABLE_NAME,
        Key: { id }
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });
  });

  describe('getByBrandId', () => {
    const brandId = faker.datatype.uuid();

    it('Should get locations based on the given brand id and without passing the additional hasOffer parameter', async () => {
      const items = [
        {
          id: faker.datatype.uuid(),
          address: faker.address.streetAddress(),
          brandId,
          hasOffer: 1,
          offerId: faker.datatype.uuid()
        }
      ];

      mockDynamoPromise.mockResolvedValue({ Items: items });

      const locations = await locationsRepository.getByBrandId(brandId);

      expect(locations).toHaveLength(1);
      expect(locations[0]).toBeInstanceOf(Location);
      expect(mockDynamoQuery).toHaveBeenCalledWith({
        TableName: locationsRepository.TABLE_NAME,
        IndexName: locationsRepository.BRAND_ID_HAS_OFFER_INDEX_NAME,
        ExpressionAttributeValues: {
          ':brandId': brandId,
          ':hasOffer': undefined
        },
        KeyConditionExpression: 'brandId = :brandId'
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });

    it('Should get locations based on the given brand id and passing the additional hasOffer parameter', async () => {
      const items = [
        {
          id: faker.datatype.uuid(),
          address: faker.address.streetAddress(),
          brandId,
          hasOffer: 0
        }
      ];

      mockDynamoPromise.mockResolvedValue({ Items: items });

      const locations = await locationsRepository.getByBrandId(brandId, false);

      expect(locations).toHaveLength(1);
      expect(locations[0]).toBeInstanceOf(Location);
      expect(mockDynamoQuery).toHaveBeenCalledWith({
        TableName: locationsRepository.TABLE_NAME,
        IndexName: locationsRepository.BRAND_ID_HAS_OFFER_INDEX_NAME,
        ExpressionAttributeValues: {
          ':brandId': brandId,
          ':hasOffer': 0
        },
        KeyConditionExpression: 'brandId = :brandId AND hasOffer = :hasOffer'
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });

    it('Should return an empty array if no item is found on the database', async () => {
      mockDynamoPromise.mockResolvedValue({ Items: undefined });

      const locations = await locationsRepository.getByBrandId(brandId, true);

      expect(locations).toHaveLength(0);
      expect(mockDynamoQuery).toHaveBeenCalledWith({
        TableName: locationsRepository.TABLE_NAME,
        IndexName: locationsRepository.BRAND_ID_HAS_OFFER_INDEX_NAME,
        ExpressionAttributeValues: {
          ':brandId': brandId,
          ':hasOffer': 1
        },
        KeyConditionExpression: 'brandId = :brandId AND hasOffer = :hasOffer'
      });
      expect(mockDynamoPromise).toHaveBeenCalled();
    });
  });
});
