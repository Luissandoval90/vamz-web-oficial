import { redirect } from "next/navigation";

type ResourceRedirectPageProps = {
  params: Promise<{
    resourceId: string;
  }>;
};

export default async function ResourceRedirectPage({ params }: ResourceRedirectPageProps) {
  const { resourceId } = await params;

  redirect(`/recurso/${resourceId}`);
}
