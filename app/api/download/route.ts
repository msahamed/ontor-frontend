import { checkBotId } from "botid/server";
import { installerDownload } from "@/lib/installer-download";
import { clientIp, consume } from "@/lib/rate-limit";

export async function POST(request: Request) {
  return installerDownload(request, {
    verify: () => checkBotId({ advancedOptions: { checkLevel: "basic" } }),
    limit: (req) => consume(`installer:${clientIp(req)}`, 20, 600),
  });
}
