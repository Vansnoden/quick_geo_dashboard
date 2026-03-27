"use client";

import Link from "next/link";
import { Button } from "@/components/buttons";
import { ArrowRightIcon } from "@heroicons/react/16/solid";
import Image from "next/image";

export default function Header(){
    return(
        <div className="">
            <nav className="bg-white fixed w-full z-20 top-0 inset-s-0 border-b border-gray-200 dark:border-gray-600">
                <div className="max-w-7xl flex flex-wrap items-center justify-between mx-auto p-4">
                    <Link href="/" className="flex items-center space-x-3 rtl:space-x-reverse">
                        <Image src="/qgd_logo.svg" className="h-8" width="50" height="50" alt="QGD Logo"></Image>
                        <span className="flex flex-col">
                            <span className="self-left text-sm font-semibold whitespace-nowrap dark:text-white">
                                Quick
                            </span><br/>
                            <span className="self-left text-sm font-semibold whitespace-nowrap dark:text-white">
                                Geo-Dashboard
                            </span>
                        </span>
                    </Link>
                    <div className="flex md:order-2 space-x-3 md:space-x-0 rtl:space-x-reverse">
		        <Link href="/dashboards" className="flex items-center mr-3 text-center text-sm text-gray-600 hover:text-purple-600">
    				<span className="self-center text-center">
					Public Dashboards
				</span>
			</Link>
                        <Link href="/login">
                            <Button> 
                                Log In
                                <ArrowRightIcon className="ml-auto h-5 w-5 text-gray-50" />
                            </Button>
                        </Link>
                    </div>
                </div>
            </nav>
        </div>
    )
}
