// import React, { useEffect, useState } from "react";
// import { Card, CardContent } from "@/components/ui/card";
// import { Button } from "@/components/ui/button";
// import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
// import {
//   Accordion,
//   AccordionItem,
//   AccordionTrigger,
//   AccordionContent,
// } from "@/components/ui/accordion";
// import { PlayCircle, Mail, Phone, ChevronDown, ChevronUp } from "lucide-react";
// import { motion } from "framer-motion";
// import { ProjectCall } from "@open-dream/shared";
// import { dateToString } from "@/util/functions/Time";
// import { useGmailByEmail } from "@/hooks/google/useGmailByEmail";

// type CustomerEmail = {
//   id: string;
//   threadId: string;
//   internalDate: string;
//   snippet: string;
//   headers: Record<string, any>;
// };

// export default function CustomerInteractionTimeline({
//   calls = [],
// }: {
//   calls: any[];
// }) {
//   const [expandedCall, setExpandedCall] = useState(null);
//   const [expandedEmail, setExpandedEmail] = useState(null);

//   const [emailsInbox, setEmailsInbox] = useState<CustomerEmail[]>([]);
//   const [emailsSent, setEmailsSent] = useState<CustomerEmail[]>([]);

//   const { fetchEmails, data } = useGmailByEmail();
//   const loadEmails = async () => {
//     const result = await fetchEmails({
//       email: "joeygoff13@gmail.com",
//       pageSize: 50,
//     });
//     console.log(result);
//     const emailData = result?.data
//     // console.log("Sent:", result?.sent);
//     setEmailsInbox(emailData?.inbox);
//     setEmailsSent(emailData?.sent);
//   };

//   useEffect(() => {
//     loadEmails();
//   }, []);

//   const toggleCall = (id: any) => {
//     setExpandedCall(expandedCall === id ? null : id);
//   };

//   const toggleEmail = (id: any) => {
//     setExpandedEmail(expandedEmail === id ? null : id);
//   };

//   return (
//     <div className="w-full h-full p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
//       <Card className="rounded-2xl shadow-lg border border-neutral-200 bg-white">
//         <CardContent className="p-6">
//           <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
//             <Phone className="w-5 h-5" /> Phone Calls
//           </h2>

//           <Accordion type="single" collapsible className="w-full">
//             {calls.map((call: ProjectCall) => (
//               <AccordionItem key={call.id} value={`call-${call.id}`}>
//                 <AccordionTrigger>
//                   <div className="flex flex-col text-left w-full">
//                     <div className="flex justify-between w-full">
//                       <span className="font-semibold">
//                         {call.direction === "inbound" ? "Inbound" : "Outbound"}{" "}
//                         Call
//                       </span>
//                       {call.created_at && (
//                         <span className="text-sm text-neutral-500">
//                           {dateToString(call.created_at)}
//                         </span>
//                       )}
//                     </div>
//                     <span className="text-neutral-500 text-sm">
//                       From: {call.from_number} → To: {call.to_number}
//                     </span>
//                   </div>
//                 </AccordionTrigger>
//                 <AccordionContent>
//                   <div className="p-4 space-y-4">
//                     {/* Recording */}
//                     {call.signed_recording_url && (
//                       <audio controls className="w-full rounded-xl">
//                         <source
//                           src={call.signed_recording_url}
//                           type="audio/mpeg"
//                         />
//                       </audio>
//                     )}

//                     {/* Transcript */}
//                     {Array.isArray(call.transcription) &&
//                       call.transcription.length > 0 && (
//                         <div className="bg-neutral-50 p-3 rounded-xl border text-sm max-h-64 overflow-y-auto">
//                           {call.transcription.map((t, idx) => (
//                             <p key={idx} className="mb-2 text-neutral-700">
//                               {t.text || JSON.stringify(t)}
//                             </p>
//                           ))}
//                         </div>
//                       )}

//                     {/* Metadata */}
//                     <div className="text-xs text-neutral-500">
//                       Agent: {call.agent_name} ({call.agent_email})
//                     </div>
//                   </div>
//                 </AccordionContent>
//               </AccordionItem>
//             ))}
//           </Accordion>
//         </CardContent>
//       </Card>

//       {/* Emails */}
//       <Card className="rounded-2xl shadow-lg border border-neutral-200 bg-white">
//         <CardContent className="p-6">
//           <h2 className="text-2xl font-semibold mb-4 flex items-center gap-2">
//             <Mail className="w-5 h-5" /> Emails
//           </h2>

//           <Tabs defaultValue="inbox">
//             <TabsList className="mb-4 grid grid-cols-2 w-full">
//               <TabsTrigger value="inbox">Inbox</TabsTrigger>
//               <TabsTrigger value="sent">Sent</TabsTrigger>
//             </TabsList>

//             {/* Inbox */}
//             <TabsContent value="inbox">
//               <Accordion type="single" collapsible>
//                 {emailsInbox &&
//                   emailsInbox.map((email: CustomerEmail) => (
//                     <AccordionItem key={email.id} value={`email-${email.id}`}>
//                       <AccordionTrigger>
//                         <div className="flex flex-col text-left w-full">
//                           <div className="flex justify-between w-full">
//                             <span className="font-semibold">Email</span>
//                             <span className="text-sm text-neutral-500">
//                               {email.internalDate}
//                             </span>
//                           </div>
//                           <span className="text-neutral-500 text-sm truncate">
//                             {email.snippet}
//                           </span>
//                         </div>
//                       </AccordionTrigger>
//                       <AccordionContent>
//                         <div className="p-4 space-y-4 text-sm text-neutral-700">
//                           <div className="bg-neutral-50 p-3 rounded-xl border max-h-64 overflow-y-auto">
//                             <pre className="whitespace-pre-wrap">
//                               {JSON.stringify(email.headers, null, 2)}
//                             </pre>
//                           </div>
//                         </div>
//                       </AccordionContent>
//                     </AccordionItem>
//                   ))}
//               </Accordion>
//             </TabsContent>

//             {/* Sent */}
//             <TabsContent value="sent">
//               <Accordion type="single" collapsible>
//                 {emailsSent &&
//                   emailsSent.map((email: CustomerEmail) => (
//                     <AccordionItem
//                       key={email.id}
//                       value={`sent-email-${email.id}`}
//                     >
//                       <AccordionTrigger>
//                         <div className="flex flex-col text-left w-full">
//                           <div className="flex justify-between w-full">
//                             <span className="font-semibold">Sent Email</span>
//                             <span className="text-sm text-neutral-500">
//                               {email.internalDate}
//                             </span>
//                           </div>
//                           <span className="text-neutral-500 text-sm truncate">
//                             {email.snippet}
//                           </span>
//                         </div>
//                       </AccordionTrigger>
//                       <AccordionContent>
//                         <div className="p-4 space-y-4 text-sm text-neutral-700">
//                           <div className="bg-neutral-50 p-3 rounded-xl border max-h-64 overflow-y-auto">
//                             <pre className="whitespace-pre-wrap">
//                               {JSON.stringify(email.headers, null, 2)}
//                             </pre>
//                           </div>
//                         </div>
//                       </AccordionContent>
//                     </AccordionItem>
//                   ))}
//               </Accordion>
//             </TabsContent>
//           </Tabs>
//         </CardContent>
//       </Card>
//     </div>
//   );
// }
