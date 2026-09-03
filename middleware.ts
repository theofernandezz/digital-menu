import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { updateSession } from "@/adapters/driven/supabase/middleware-client";

export async function middleware(request: NextRequest): Promise<NextResponse> {
  return updateSession(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|public/).*)"],
};
