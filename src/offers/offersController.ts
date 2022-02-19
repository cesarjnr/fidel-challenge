import { APIGatewayProxyEventV2, APIGatewayProxyResultV2, APIGatewayProxyEventPathParameters } from 'aws-lambda';

import * as offersService from './offersService';
import { EntityNotFoundError, ConflictError } from '../errors';

export const listOffers = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const offers = await offersService.listOffers();

    return {
      statusCode: 200,
      body: JSON.stringify({
        resource: event.rawPath,
        items: offers
      })
    };
  } catch (error) {
    return handleError(event, error);
  }
}

export const linkLocationToOffer = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const { offerId, locationId } = event.pathParameters as APIGatewayProxyEventPathParameters;

    await offersService.linkLocationToOffer(String(offerId), String(locationId));

    return {
      statusCode: 200,
      body: JSON.stringify({
        resource: event.rawPath
      })
    };
  } catch (error) {
    return handleError(event, error);
  }
}

export const linkAllBrandLocationsToOffer = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
    const { offerId, brandId } = event.pathParameters as APIGatewayProxyEventPathParameters;

    await offersService.linkAllBrandLocationsToOffer(String(offerId), String(brandId));

    return {
      statusCode: 200,
      body: JSON.stringify({
        resource: event.rawPath
      })
    };
  } catch (error) {
    return handleError(event, error);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (event: APIGatewayProxyEventV2, error: any): APIGatewayProxyResultV2 => {
  let statusCode = 500;

  if (error instanceof EntityNotFoundError) {
    statusCode = 404;
  } else if (error instanceof ConflictError) {
    statusCode = 409;
  }

  return {
    statusCode,
    body: JSON.stringify({
      resource: event.rawPath,
      error: {
        message: error.message
      }
    })
  };
}
