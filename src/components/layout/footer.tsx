import Link from "next/link";
import { Leaf, Mail, Phone, Globe, Camera, MessageCircle } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-gray-200 bg-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-12">
        <div className="grid gap-10 sm:grid-cols-2">
          {/* Brand */}
          <div className="space-y-4">
            <Link href="/" className="inline-flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-green-600">
                <Leaf className="size-5 text-white" />
              </div>
              <span className="text-lg font-bold text-gray-900">
                FarmConnect
              </span>
            </Link>
            <p className="text-sm leading-relaxed text-gray-500 max-w-sm">
              ตลาดสินค้าเกษตรออนไลน์ที่เชื่อมต่อเกษตรกรไทยกับผู้บริโภคโดยตรง
              สด สะอาด ปลอดภัย ส่งตรงถึงบ้านคุณ
            </p>
          </div>

          {/* Contact */}
          <div>
            <h3 className="mb-4 text-xs font-semibold uppercase tracking-[0.1em] text-gray-400">
              ติดต่อเรา
            </h3>
            <ul className="space-y-3">
              <li>
                <a href="mailto:contact@farmconnect.co.th" className="group inline-flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-green-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                    <Mail className="size-4" />
                  </span>
                  <span>contact@farmconnect.co.th</span>
                </a>
              </li>
              <li>
                <a href="tel:+6621234567" className="group inline-flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-green-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                    <Phone className="size-4" />
                  </span>
                  <span>02-123-4567</span>
                </a>
              </li>
              <li>
                <a href="https://facebook.com/farmconnect" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-green-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                    <Globe className="size-4" />
                  </span>
                  <span>FarmConnect Thailand</span>
                </a>
              </li>
              <li>
                <a href="https://instagram.com/farmconnect" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-green-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                    <Camera className="size-4" />
                  </span>
                  <span>@farmconnect</span>
                </a>
              </li>
              <li>
                <a href="https://twitter.com/farmconnect" target="_blank" rel="noopener noreferrer" className="group inline-flex items-center gap-3 text-sm text-gray-600 transition-colors hover:text-green-600">
                  <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-green-50 text-green-600 transition-colors group-hover:bg-green-100">
                    <MessageCircle className="size-4" />
                  </span>
                  <span>@farmconnect</span>
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-10 border-t pt-6 text-center">
          <p className="text-xs text-gray-400">
            &copy; {new Date().getFullYear()} FarmConnect. สงวนลิขสิทธิ์.
          </p>
        </div>
      </div>
    </footer>
  );
}
