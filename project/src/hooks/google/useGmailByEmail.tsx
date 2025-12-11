import { useMutation } from "@tanstack/react-query";
import { useContextQueries } from "@/contexts/queryContext/queryContext";

export function useGmailByEmail() {
  const { runModule } = useContextQueries();

  const mutation = useMutation({
    mutationFn: async (params: { email: string; pageSize?: number }) => {
      const { email, pageSize = 50 } = params;
      return await runModule("google-gmail-module", {
        requestType: "GET_EMAILS_BY_ADDRESS",
        targetEmail: email,
        pageSize,
      });
    },
  });

  return {
    fetchEmails: mutation.mutateAsync,
    data: mutation.data,
    isPending: mutation.isPending,  
    isError: mutation.isError,
    error: mutation.error,
    isSuccess: mutation.isSuccess,
  };
}