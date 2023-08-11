export function createError(fieldArg: string, errorMessage: string) {
  return {
    errors: [
      {
        field: fieldArg,
        message: errorMessage,
      },
    ],
  };
}
