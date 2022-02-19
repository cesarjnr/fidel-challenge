import * as faker from 'faker';
import { APIGatewayProxyEventV2 } from 'aws-lambda';

import * as locationsRepository from './locationsRepository';
import * as locationsController from './locationsController';
import { Location } from './locationsEntity';

jest.mock('./locationsRepository');

describe('locationsController', () => {
  const mockLocationsRepository = locationsRepository as jest.Mocked<typeof locationsRepository>;

  describe('listLocations', () => {
    const mockEvent = { rawPath: '/locations' } as APIGatewayProxyEventV2;

    it('Should get locations and return them with the status 200', async () => {
      const locations = [
        new Location(
          faker.datatype.uuid(),
          faker.address.streetAddress(),
          faker.datatype.uuid(),
          1,
          faker.datatype.uuid()
        ),
        new Location(
          faker.datatype.uuid(),
          faker.address.streetAddress(),
          faker.datatype.uuid(),
          0
        )
      ];

      mockLocationsRepository.index.mockResolvedValue(locations);

      const response = await locationsController.listLocations(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 200,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          items: [
            { ...locations[0], hasOffer: true },
            { ...locations[1], hasOffer: false }
          ]
        })
      });
      expect(mockLocationsRepository.index).toHaveBeenCalled();
    });

    it('Should catch some exception and return its message with the status 500', async () => {
      const mockThrownError = new Error('Some error message');

      mockLocationsRepository.index.mockRejectedValue(mockThrownError);

      const response = await locationsController.listLocations(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 500,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      })
    });
  });
});
