import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';

import { index } from './locationsRepository';

export const listLocations = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  try {
  const locations = await index();

  return {
    statusCode: 200,
    body: JSON.stringify({
      resource: event.rawPath,
      items: locations.map((location) => Object.assign(
        location,
        { hasOffer: Boolean(location.hasOffer) }
      ))
    })
  };
  } catch (error) {
    return handleError(event, error);
  }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const handleError = (event: APIGatewayProxyEventV2, error: any): APIGatewayProxyResultV2 => {
  return {
    statusCode: 500,
    body: JSON.stringify({
      resource: event.rawPath,
      error: {
        message: error.message
      }
    })
  }
}
