import { createSocket } from "node:dgram";
import { networkInterfaces } from "node:os";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

function isPrivateIpv4(address: string) {
  if (address.startsWith("10.")) return true;
  if (address.startsWith("192.168.")) return true;

  const parts = address.split(".").map((part) => Number(part));
  return parts.length === 4 && parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31;
}

type LanAddress = {
  address: string;
  interfaceName: string;
};

const virtualInterfacePattern = /bluetooth|docker|hyper-v|loopback|npcap|virtual|virtualbox|vmware|vethernet|wsl/i;

function addressScore(item: LanAddress) {
  const virtualPenalty = virtualInterfacePattern.test(item.interfaceName) ? 100 : 0;
  const interfaceScore = /wi-?fi|wlan|wireless/i.test(item.interfaceName)
    ? 0
    : /^ethernet$/i.test(item.interfaceName)
      ? 1
      : /^ethernet\s+\d+$/i.test(item.interfaceName)
        ? 5
        : 3;
  const rangeScore = item.address.startsWith("192.168.") ? 0 : item.address.startsWith("10.") ? 0.1 : 0.2;

  return virtualPenalty + interfaceScore + rangeScore;
}

function getLanAddresses() {
  return Object.entries(networkInterfaces())
    .flatMap(([interfaceName, interfaces]) =>
      (interfaces ?? [])
        .filter((item) => item.family === "IPv4" && !item.internal && isPrivateIpv4(item.address))
        .map((item) => ({ address: item.address, interfaceName })),
    )
    .sort((a, b) => addressScore(a) - addressScore(b));
}

async function getActiveInternetAddress() {
  return new Promise<string | undefined>((resolve) => {
    const socket = createSocket("udp4");
    let settled = false;

    function finish(address?: string) {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      socket.close();
      resolve(address);
    }

    const timeout = setTimeout(() => finish(), 500);
    socket.once("error", () => finish());
    socket.connect(80, "8.8.8.8", () => {
      const address = socket.address();
      finish(typeof address === "object" ? address.address : undefined);
    });
  });
}

export async function GET(request: Request) {
  const currentUrl = new URL(request.url);
  const port = currentUrl.port ? `:${currentUrl.port}` : "";
  const activeAddress = await getActiveInternetAddress();
  const addresses = getLanAddresses();
  const activeLanAddress = addresses.find((item) => item.address === activeAddress);
  const orderedAddresses = activeLanAddress
    ? [activeLanAddress, ...addresses.filter((item) => item.address !== activeLanAddress.address)]
    : addresses;
  const links = orderedAddresses.map((item, index) => ({
    label: index === 0 && item.address === activeAddress ? "Connexion active" : item.interfaceName,
    url: `${currentUrl.protocol}//${item.address}${port}`,
  }));
  const urls = Array.from(new Set(links.map((item) => item.url)));
  const primaryUrl = urls[0] ?? currentUrl.origin;

  return Response.json({
    currentUrl: currentUrl.origin,
    links,
    primaryUrl,
    urls,
    isLanReady: urls.length > 0,
  });
}
