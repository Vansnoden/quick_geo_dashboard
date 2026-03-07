import Image from "next/image";
import Header from "./ui/home/header";
import Footer from "./ui/home/footer";
import { lusitana } from "./ui/fonts";
import Link from "next/link";
import { Button } from "./ui/buttons";
import { DocumentArrowDownIcon, DocumentIcon } from "@heroicons/react/24/outline";
import { DocumentChartBarIcon } from "@heroicons/react/24/solid";

export default function Home() {
  return (
    <div>
      <Header></Header>
      <div className="mx-auto mt-5 flex flex-col items-center justify-center mcontent">
        <div className="py-10">
            <div className="max-w-7xl bg-white p-4 rounded-md">
              <h1 className={`${lusitana.className} mb-4 text-xl md:text-2xl text-center py-4`}>
                Welcome to the Quick Geo Dashboard creation tool
              </h1>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4">
                <div>
                  <Image src="/QGD.drawio.png" alt="Banner image" width="600" height="500" className=""></Image>
                </div>
                <div className={`${lusitana.className} mt-4 mb-4 text-wrap text-justify`}>
                  <p>
                    The goal of this tool is to enable non-technical users to quickly transform 
                    tabular data (CSV or Excel) into interactive, shareable geo-dashboards. A domain-specific 
                    language based on YAML allows users to define the dashboard's layout, charts, map layers, 
                    and textual content without writing code. The system automatically ingests the data, creates 
                    a database table, and generates a lightweight JavaScript configuration that drives a modern, 
                    responsive frontend built with Next.js, Leaflet, and Recharts.
                  </p>
                  <p className="mt-3">
                    You can consult our documentation using the link bellow:
                    <Link href="/admin/documentation">
                      <Button> 
                        Go to Documentation
                        <DocumentIcon className="ml-auto h-5 w-5 text-gray-50" />
                      </Button>
                    </Link>
                  </p>
                  <p className="mt-3">
                    You can consult free dashboard examples using the link bellow
                    <Link href="#">
                      <Button> 
                        See examples of dashboards
                        <DocumentChartBarIcon className="ml-auto h-5 w-5 text-gray-50" />
                      </Button>
                    </Link>
                  </p>
                </div>
              </div>
            </div>
          </div>
      </div>
      <Footer></Footer>
    </div>
  );
}
