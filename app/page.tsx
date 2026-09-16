import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
import { LandingPage } from "@/components/Landing/LandingPage";
import { DashboardClient } from "@/components/Dashboard/DashboardClient";

export default async function HomePage() {
  const cookieStore = await cookies();
  const supabase = createClient(cookieStore);
  const { data: { user } } = await supabase.auth.getUser();

  // Jika pengunjung belum login, langsung tampilkan Landing Page tanpa loading screen apapun!
  if (!user) {
    return <LandingPage />;
  }

  // Jika sudah terautentikasi, tampilkan Dashboard AI
  return <DashboardClient initialUser={user} />;
}
