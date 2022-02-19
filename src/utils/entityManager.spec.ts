import * as faker from 'faker';

import { Offer } from '../offers/offersEntity';
import { Location } from '../locations/locationsEntity';

describe('entityManager', () => {
  const mockDynamoPromise = jest.fn();
  const mockDynamoTransactWrite = jest.fn().mockReturnValue({ promise: mockDynamoPromise });
  const mockDynamoListTables = jest.fn().mockReturnValue({ promise: mockDynamoPromise });

  jest.doMock('aws-sdk', () => {
    const DynamoDB = jest.fn().mockReturnValue({ listTables: mockDynamoListTables });

    // @ts-ignore
    DynamoDB.DocumentClient = jest.fn().mockReturnValue({ transactWrite: mockDynamoTransactWrite });

    return { DynamoDB };
  });

  const entityManager = require('./entityManager');

  describe('transactPersist', () => {
    const entities = [
      new Offer(
        faker.datatype.uuid(),
        faker.random.words(5),
        faker.datatype.uuid(),
        faker.datatype.number(100)
      ),
      new Location(
        faker.datatype.uuid(),
        faker.address.streetAddress(),
        faker.datatype.uuid(),
        0
      )
    ];

    it('Should throw an Error exception if no table is found for the given entities type', async () => {
      const mockThrownError = new Error(`No table was found for entity 'Offer'`);

      mockDynamoPromise.mockResolvedValueOnce({ TableNames: ['some_table'] });

      await expect(entityManager.transactPersist(entities))
        .rejects
        .toStrictEqual(mockThrownError);
      expect(mockDynamoListTables).toHaveBeenCalled();
      expect(mockDynamoPromise).toHaveBeenCalledTimes(1);
    });

    it('Should throw an Error exception if no table is found on the database', async () => {
      const mockThrownError = new Error(`No table was found for entity 'Offer'`);

      mockDynamoPromise.mockResolvedValueOnce({ TableNames: undefined });

      await expect(entityManager.transactPersist(entities))
        .rejects
        .toStrictEqual(mockThrownError);
      expect(mockDynamoListTables).toHaveBeenCalled();
      expect(mockDynamoPromise).toHaveBeenCalledTimes(1);
    });

    it('Should persist the given entities in a transaction', async () => {
      mockDynamoPromise.mockResolvedValueOnce({ TableNames: ['offers', 'locations'] });

      await entityManager.transactPersist(entities);

      expect(mockDynamoListTables).toHaveBeenCalled();
      expect(mockDynamoTransactWrite).toHaveBeenCalledWith({
        TransactItems: [
          {
            Put: {
              TableName: 'offers',
              Item: entities[0]
            }
          },
          {
            Put: {
              TableName: 'locations',
              Item: entities[1]
            }
          }
        ]
      })
    });
  });
});
