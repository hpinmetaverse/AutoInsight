import { buttonVariants } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";
import { SignedIn } from "@clerk/clerk-react";
import { History, HomeIcon, Library, MessageCircle } from "lucide-react";

import { Link } from "react-router-dom";

const LeftSidebar = () => {
  return (
    <div className="h-full flex flex-col gap-2">
      {/* Menu */}
      <div className="rounded-lg p-4 bg-zinc-900">
        <div className="space-y-2">
          <Link
            to={"/"}
            className={cn(
              buttonVariants({
                variant: "ghost",
                className: "w-full justify-start text-white hover:bg-zinc-800",
              })
            )}
          >
            <HomeIcon className="mr-2 size-5" />
            <span className="hidden md:inline">Home</span>
          </Link>
          <SignedIn>
            <Link
              to={"/chat"}
              className={cn(
                buttonVariants({
                  variant: "ghost",
                  className:
                    "w-full justify-start text-white hover:bg-zinc-800",
                })
              )}
            >
              <History className="mr-2 size-5" />
              <span className="hidden md:inline">History</span>
            </Link>
          </SignedIn>
        </div>
      </div>
      {/* Library */}
      <div className="flex-1 rounded-lg bg-zinc-900 p-4">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center text-white px-2">
            <Library className="size-5 mr-2" />
            <span className="hidden md:inline"> Integrations</span>
          </div>
        </div>
        <ScrollArea className="h-[calc(100vh-300px)]"></ScrollArea>
      </div>
    </div>
  );
};

export default LeftSidebar;
