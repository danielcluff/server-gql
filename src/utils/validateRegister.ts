import { UserAccountInput } from "../resolvers/inputs/UserAccountInput";

export const validateRegister = (options: UserAccountInput) => {
  if (!options.email.includes("@")) {
    return [
      {
        field: "email",
        message: "Invalid email",
      },
    ];
  }

  if (options.username.length <= 2) {
    return [
      {
        field: "username",
        message: "Username length must be greater than 2",
      },
    ];
  }

  if (options.username.includes("@")) {
    return [
      {
        field: "username",
        message: "Username cannot include an '@'",
      },
    ];
  }

  validatePassword(options.password);

  return null;
};

export function validatePassword(password: string) {
  if (password.length <= 6) {
    return [
      {
        field: "password",
        message: "Password length must be at least 6 characters",
      },
    ];
  }

  return null;
}
