import ShortlistBoard from "../../../components/ShortlistBoard";

export default async function ShortlistPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return <ShortlistBoard token={token} />;
}
