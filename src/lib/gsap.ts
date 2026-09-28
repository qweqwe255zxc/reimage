"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

gsap.registerPlugin(useGSAP, ScrollTrigger);

// same curve the css uses (--ease)
export const EASE = "power4.inOut";

export { gsap, ScrollTrigger, useGSAP };
