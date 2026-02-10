function isSecureRequest(req: any) {
  if (req?.protocol === "https") return true;

  const forwardedProto = req?.headers?.["x-forwarded-proto"];
  if (!forwardedProto) return false;

  const protoList = Array.isArray(forwardedProto)
    ? forwardedProto
    : String(forwardedProto).split(",");

  return protoList.some((proto: string) => proto.trim().toLowerCase() === "https");
}

export function getSessionCookieOptions(req: any) {
  return {
    httpOnly: true,
    path: "/",
    sameSite: "none" as const,
    secure: isSecureRequest(req),
  };
}
