import { IconStyle } from "../types/models/ui";

// shared/definitions/appDetails.ts
export const appDetails = {
  "default_theme": "dark",
  "default_icon_style": "filled" as IconStyle,
  "left_bar_full": false,
  "left_bar_width": "150px + 6vw",
  "nav_height": 70,
  "admin_email": "opendreamstudios@gmail.com",
  "default_color": "#451D65",
  "default_title": "CMS",
  "default_landing_color": "#000000",
  "default_logo": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/logo.png",
  "default_hero": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/img4.jpg",
  "default_landing_hero_style": "object-contain",
  "default_slides": [
    "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/img1.png",
    "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/img2.png",
    "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/img3.jpg"
  ],
  "projects": [
    {
      "key": "tsa",
      "brand": "TSA",
      "icon_style": "filled" as IconStyle,
      "darken_landing": true,
      "landing_color": "#000000",
      "domain": "tannyspaacquisitions.shop",
      "app_color": "#50A1CD",
      "landing_title": "TSA Portal",
      "landing_logo": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/projects/tsa/logo.png",
      "landing_hero_sm": "https://static.wixstatic.com/media/591e05_1778099a5e8f44cfae54657f43f447c4~mv2.png/v1/fill/w_647,h_1024,al_c,q_90,enc_avif,quality_auto/591e05_1778099a5e8f44cfae54657f43f447c4~mv2.png",
      "landing_hero_md": "https://static.wixstatic.com/media/591e05_1778099a5e8f44cfae54657f43f447c4~mv2.png/v1/fill/w_647,h_1024,al_c,q_90,enc_avif,quality_auto/591e05_1778099a5e8f44cfae54657f43f447c4~mv2.png",
      "landing_hero_lg": "https://static.wixstatic.com/media/591e05_1778099a5e8f44cfae54657f43f447c4~mv2.png/v1/fill/w_647,h_1024,al_c,q_90,enc_avif,quality_auto/591e05_1778099a5e8f44cfae54657f43f447c4~mv2.png",
      "landing_hero_style": "object-cover",
      "landing_slides": [
        "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/projects/tsa/slide1.png",
        "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/projects/tsa/slide2.png",
        "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/global/projects/tsa/slide3.png"
      ],
      "email_config": {
        "businessName": "Tanny Spa Acquisitions",
        "logoUrl":
          "https://tsa-cms-data.s3.us-east-2.amazonaws.com/global/full-logo2.png",
        "manageBookingUrl": "https://tannyspaacquisitions.shop",
        "primaryColor": "#5CADD8",
        "phoneNumber": "(585) 666-8794"
      },
      "stripe_account": "acct_1T2zx87vzK6BGNZg",
      "credit1_name": "Cleaning",
      "credit2_name": "Clean & Drain",
      "subscription_tiers": {
        1: "basic",
        2: "standard",
        3: "premium"
      }
    },
    {
      "key": "tcr",
      "brand": "Tri Cities",
      "icon_style": "thin" as IconStyle,
      "darken_landing": false,
      "landing_color": "#181717",
      "domain": "tricitiesremodeling.shop",
      "app_color": "#50A1CD",
      "landing_title": "Tri Cities Remodeling",
      "landing_logo": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/logo.png",
      "landing_hero_sm": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/TC_SMALL_V2.png",
      "landing_hero_md": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/TC_MED.png",
      "landing_hero_lg": "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/TC_LARGE.png",
      "landing_hero_style": "object-cover",
      "landing_slides": [
        "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/1.jpeg",
        "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/2.jpeg",
        "https://dev-cms-project-media.s3.us-east-1.amazonaws.com/projects-global/Tri-Cities/3.jpeg"
      ],
      "email_config": {
        "businessName": "Tri Cities Remodeling",
        "logoUrl":
          "https://tsa-cms-data.s3.us-east-2.amazonaws.com/global/full-logo2.png",
        "manageBookingUrl": "tricitiesremodeling.shop",
        "primaryColor": "#5CADD8",
        "phoneNumber": "(585) 666-8794"
      },
      "stripe_account": null,
      "credit1_name": null,
      "credit2_name": null,
      "subscription_tiers": {
        1: "basic",
        2: "standard",
        3: "premium"
      }
    }
  ]
} as const;