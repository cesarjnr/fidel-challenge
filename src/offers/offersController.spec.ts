import * as faker from 'faker';
import { APIGatewayProxyEventV2, APIGatewayProxyEventPathParameters } from 'aws-lambda';

import * as offersService from './offersService';
import * as offersController from './offersController';
import { Offer } from './offersEntity';
import { EntityNotFoundError, ConflictError } from '../errors';

jest.mock('./offersService');

describe('offersController', () => {
  const mockOffersService = offersService as jest.Mocked<typeof offersService>;

  describe('listOffers', () => {
    const mockEvent = { rawPath: '/offers' } as APIGatewayProxyEventV2;

    it('Should get offers and return them with the status 200', async () => {
      const offers = [
        new Offer(
          faker.datatype.uuid(),
          faker.random.words(5),
          faker.datatype.uuid(),
          faker.datatype.number(100)
        )
      ];

      mockOffersService.listOffers.mockResolvedValue(offers);

      const response = await offersController.listOffers(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 200,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          items: offers
        })
      });
      expect(mockOffersService.listOffers).toHaveBeenCalled();
    });

    it('Should catch some exception and return its message with the status 500', async () => {
      const mockThrownError = new Error('Some error message');

      mockOffersService.listOffers.mockRejectedValue(mockThrownError);

      const response = await offersController.listOffers(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 500,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      });
      expect(mockOffersService.listOffers).toHaveBeenCalled();
    });
  });

  describe('linkLocationToOffer', () => {
    const offerId = faker.datatype.uuid();
    const locationId = faker.datatype.uuid();
    const mockEvent = {
      rawPath: `/offers/${offerId}/locations/${locationId}`,
      pathParameters: {
        offerId,
        locationId
      } as APIGatewayProxyEventPathParameters
    } as APIGatewayProxyEventV2;

    it('Should link a location to an offer and return the status 200', async () => {
      const response = await offersController.linkLocationToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 200,
        body: JSON.stringify({
          resource: mockEvent.rawPath
        })
      });
      expect(offersService.linkLocationToOffer).toHaveBeenCalledWith(offerId, locationId);
    });

    it('Should catch an EntityNotFoundError exception and return its message with the status 404', async () => {
      const mockThrownError = new EntityNotFoundError('Entity not found');

      mockOffersService.linkLocationToOffer.mockRejectedValue(mockThrownError);

      const response = await offersController.linkLocationToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 404,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      });
      expect(mockOffersService.linkLocationToOffer).toHaveBeenCalledWith(offerId, locationId);
    });

    it('Should catch a ConflictError exception and return its message with the status 409', async () => {
      const mockThrownError = new ConflictError('Conflict happened');

      mockOffersService.linkLocationToOffer.mockRejectedValue(mockThrownError);

      const response = await offersController.linkLocationToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 409,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      });
      expect(mockOffersService.linkLocationToOffer).toHaveBeenCalledWith(offerId, locationId);
    });

    it('Should catch some other exception and return its message with the status 500', async () => {
      const mockThrownError = new Error('Some error message');

      mockOffersService.linkLocationToOffer.mockRejectedValue(mockThrownError);

      const response = await offersController.linkLocationToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 500,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      });
      expect(mockOffersService.linkLocationToOffer).toHaveBeenCalledWith(offerId, locationId);
    });
  });

  describe('linkAllBrandLocationsToOffer', () => {
    const offerId = faker.datatype.uuid();
    const brandId = faker.datatype.uuid();
    const mockEvent = {
      rawPath: `/offers/${offerId}/brands/${brandId}`,
      pathParameters: {
        offerId,
        brandId
      } as APIGatewayProxyEventPathParameters
    } as APIGatewayProxyEventV2;

    it('Should link all locations from a given brand to an offer and reutrn the status 200', async () => {
      const response = await offersController.linkAllBrandLocationsToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 200,
        body: JSON.stringify({
          resource: mockEvent.rawPath
        })
      });
      expect(offersService.linkAllBrandLocationsToOffer).toHaveBeenCalledWith(offerId, brandId);
    });

    it('Should catch an EntityNotFoundError exception and return its message with the status 404', async () => {
      const mockThrownError = new EntityNotFoundError('Entity not found');

      mockOffersService.linkAllBrandLocationsToOffer.mockRejectedValue(mockThrownError);

      const response = await offersController.linkAllBrandLocationsToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 404,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      });
      expect(mockOffersService.linkAllBrandLocationsToOffer).toHaveBeenCalledWith(offerId, brandId);
    });

    it('Should catch some other exception and return its message with the status 500', async () => {
      const mockThrownError = new Error('Some error message');

      mockOffersService.linkAllBrandLocationsToOffer.mockRejectedValue(mockThrownError);

      const response = await offersController.linkAllBrandLocationsToOffer(mockEvent);

      expect(response).toStrictEqual({
        statusCode: 500,
        body: JSON.stringify({
          resource: mockEvent.rawPath,
          error: {
            message: mockThrownError.message
          }
        })
      });
      expect(mockOffersService.linkAllBrandLocationsToOffer).toHaveBeenCalledWith(offerId, brandId);
    });
  });
});
