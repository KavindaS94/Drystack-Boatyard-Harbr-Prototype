import { Fragment, type ReactNode } from "react";
import { MessageCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "../components/ui/breadcrumb";
import { Separator } from "../components/ui/separator";
import { SidebarTrigger } from "../components/ui/sidebar";

type HeaderProps = {
  pages?: string[];
  page?: string;
  children?: ReactNode;
};

export function AppHeader({ pages = [], page = "", children }: HeaderProps) {
  return (
    <header className="flex h-16 shrink-0 items-center justify-between gap-2">
      <div className="flex items-center gap-2 px-4">
        <SidebarTrigger className="-ml-1" />
        <Separator orientation="vertical" className="mr-2 h-4" />
        <Breadcrumb>
          <BreadcrumbList>
            {pages.map((name, index) => (
              <Fragment key={`${index}-${name}`}>
                {index > 0 ? <BreadcrumbSeparator className="hidden md:block" /> : null}
                <BreadcrumbItem className="hidden md:block">
                  <span className="text-sm">{name}</span>
                </BreadcrumbItem>
              </Fragment>
            ))}
            {pages.length > 0 && page ? <BreadcrumbSeparator className="hidden md:block" /> : null}
            {page ? (
              <BreadcrumbItem>
                <BreadcrumbPage>{page}</BreadcrumbPage>
              </BreadcrumbItem>
            ) : null}
          </BreadcrumbList>
        </Breadcrumb>
      </div>
      <div className="flex items-center gap-2 pr-4">
        {children}
        <button
          type="button"
          onClick={() => toast.message("Not in this prototype", { description: "Chat" })}
          className="rounded-full p-2 hover:bg-gray-100"
          aria-label="Open AI Chat"
        >
          <MessageCircle className="h-5 w-5" style={{ color: "#9079ec" }} />
        </button>
      </div>
    </header>
  );
}
