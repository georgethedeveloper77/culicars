// Copyright (c) 2019, the PS Project authors.  Please see the AUTHORS file
// for details. All rights reserved. Use of this source code is governed by a
// PS license that can be found in the LICENSE file.

import 'package:flutter/material.dart';

import '../core/vendor/utils/utils.dart';
import '../core/vendor/viewobject/mobile_color.dart';

/// Colors Config For the whole App
/// Please change the color based on your brand need.

class PsColors {
  PsColors._();

  ///
  /// Primary Colors
  ///
  static Color primary50 = const Color(0xFFFFEBEE);
  static Color primary100 = const Color(0xFFFFCDD2);
  static Color primary200 = const Color(0xFFEF9A9A);
  static Color primary300 = const Color(0xFFE57373);
  static Color primary400 = const Color(0xFFEF5350);
  static Color primary500 = const Color(0xFFF44336);
  static Color primary600 = const Color(0xFFE53935);
  static Color primary700 = const Color(0xFFD32F2F);
  static Color primary800 = const Color(0xFFC62828);
  static Color primary900 = const Color(0xFFB71C1C);

  /*static Color primary50 = const Color(0xFFE5EAFF);
  static Color primary100 = const Color(0xFFC2CCFF);
  static Color primary200 = const Color(0xFFA8B6FF);
  static Color primary300 = const Color(0xFF8FA1FF);
  static Color primary400 = const Color(0xFF667FFF);
  static Color primary500 = const Color(0xFF001063);
  static Color primary600 = const Color(0xFF001EB8);
  static Color primary700 = const Color(0xFF00178F);
  static Color primary800 = const Color(0xFF001270);
  static Color primary900 = const Color(0xFF000E57);*/

  ///
  /// Text Colors
  ///
  static Color text50 = const Color(0xFFF1F1F3);
  static Color text100 = const Color(0xFFDEDEE3);
  static Color text200 = const Color(0xFFD0D0D7);
  static Color text300 = const Color(0xFFC2C2CB);
  static Color text400 = const Color(0xFFACACB9);
  static Color text500 = const Color(0xFF2E2E36);
  static Color text600 = const Color(0xFF545463);
  static Color text700 = const Color(0xFF42424D);
  static Color text800 = const Color(0xFF34343D);
  static Color text900 = const Color(0xFF28282F);

  ///
  /// Accent Colors
  ///
  static Color accent50 = const Color(0xFFFDF2F8);
  static Color accent100 = const Color(0xFFFCE7F3);
  static Color accent200 = const Color(0xFFFACEE7);
  static Color accent300 = const Color(0xFFF9A8D4);
  static Color accent400 = const Color(0xFFF372B5);
  static Color accent500 = const Color(0xFFEB4898);
  static Color accent600 = const Color(0xFFDB2777);
  static Color accent700 = const Color(0xFFBE185D);
  static Color accent800 = const Color(0xFF9C174D);
  static Color accent900 = const Color(0xFF831843);

  ///
  /// Sematic - Success Colors
  ///
  static Color success50 = const Color(0xFFE9FBEA);
  static Color success100 = const Color(0xFFCBF6CC);
  static Color success200 = const Color(0xFFB5F2B7);
  static Color success300 = const Color(0xFFA0EEA2);
  static Color success400 = const Color(0xFF7DE880);
  static Color success500 = const Color(0xFF167C19);
  static Color success600 = const Color(0xFF1C9C1F);
  static Color success700 = const Color(0xFF167918);
  static Color success800 = const Color(0xFF115F13);
  static Color success900 = const Color(0xFF0D4A0F);

  ///
  /// Sematic - Error Colors
  ///
  static Color error50 = const Color(0xFFFFE8E6);
  static Color error100 = const Color(0xFFFEC7C3);
  static Color error200 = const Color(0xFFFEAFA9);
  static Color error300 = const Color(0xFFFE9890);
  static Color error400 = const Color(0xFFFD7268);
  static Color error500 = const Color(0xFFFC1605);
  static Color error600 = const Color(0xFFB50F02);
  static Color error700 = const Color(0xFF8D0B02);
  static Color error800 = const Color(0xFF6F0901);
  static Color error900 = const Color(0xFF560701);

  ///
  /// Sematic - Warning Colors
  ///
  static Color warning50 = const Color(0xFFFFFEE6);
  static Color warning100 = const Color(0xFFFFFCC2);
  static Color warning200 = const Color(0xFFFEFBA9);
  static Color warning300 = const Color(0xFFFEFA90);
  static Color warning400 = const Color(0xFFFEF867);
  static Color warning500 = const Color(0xFFF3EA02);
  static Color warning600 = const Color(0xFFB6AF01);
  static Color warning700 = const Color(0xFF8E8801);
  static Color warning800 = const Color(0xFF6F6B01);
  static Color warning900 = const Color(0xFF565301);

  ///
  /// Sematic - Info Colors
  ///
  static Color info50 = const Color(0xFFE5FDFF);
  static Color info100 = const Color(0xFFC2FBFF);
  static Color info200 = const Color(0xFFA8FAFF);
  static Color info300 = const Color(0xFF8FF8FF);
  static Color info400 = const Color(0xFF66F6FF);
  static Color info500 = const Color(0xFF007C84);
  static Color info600 = const Color(0xFF00868F);
  static Color info700 = const Color(0xFF00868F);
  static Color info800 = const Color(0xFF006970);
  static Color info900 = const Color(0xFF005157);

  ///
  /// Achromatic Colors
  ///
  static Color achromatic50 = const Color(0xFFFFFFFF);
  static Color achromatic100 = const Color(0xFFEBEBEB);
  static Color achromatic200 = const Color(0xFFD6D6D6);
  static Color achromatic300 = const Color(0xFFB8B8B8);
  static Color achromatic400 = const Color(0xFF999999);
  static Color achromatic500 = const Color(0xFF858585);
  static Color achromatic600 = const Color(0xFF666666);
  static Color achromatic700 = const Color(0xFF363636);
  static Color achromatic800 = const Color(0xFF292929);
  static Color achromatic900 = const Color(0xFF121212);

  ///
  /// Brand Colors
  ///
  static Color facebookColor = const Color(0xFF3B5999);
  static Color googleColor = const Color(0xFFDD4B39);
  static Color phoneColor = const Color(0xFF38C141);
  static Color appleColor = const Color(0xFF000000);
  static Color paypalColor = const Color(0xFF003087);
  static Color stripeColor = const Color(0xFF00AFE1);
  static Color razorColor = const Color(0xFF003087);
  static Color paystackColor = const Color(0xFF00C3F7);

  static void replaceColor(MobileColor mobileColor) {
    // primary300 = Utils.codeToColor('rgba(0, 255, 38, 0.5)', primary500);
    // primary500 = Utils.codeToColor('#EF58', primary500);
    primary50 = Utils.codeToColor(mobileColor.primary50, primary50);
    primary100 = Utils.codeToColor(mobileColor.primary100, primary100);
    primary200 = Utils.codeToColor(mobileColor.primary200, primary200);
    primary300 = Utils.codeToColor(mobileColor.primary300, primary300);
    primary400 = Utils.codeToColor(mobileColor.primary400, primary400);
    primary500 = Utils.codeToColor(mobileColor.primary500, primary500);
    primary600 = Utils.codeToColor(mobileColor.primary600, primary600);
    primary700 = Utils.codeToColor(mobileColor.primary700, primary700);
    primary800 = Utils.codeToColor(mobileColor.primary800, primary800);
    primary900 = Utils.codeToColor(mobileColor.primary900, primary900);

    text50 = Utils.codeToColor(mobileColor.text50, text50);
    text100 = Utils.codeToColor(mobileColor.text100, text100);
    text200 = Utils.codeToColor(mobileColor.text200, text200);
    text300 = Utils.codeToColor(mobileColor.text300, text300);
    text400 = Utils.codeToColor(mobileColor.text400, text400);
    text500 = Utils.codeToColor(mobileColor.text500, text500);
    text600 = Utils.codeToColor(mobileColor.text600, text600);
    text700 = Utils.codeToColor(mobileColor.text700, text700);
    text800 = Utils.codeToColor(mobileColor.text800, text800);
    text900 = Utils.codeToColor(mobileColor.text900, text900);

    accent50 = Utils.codeToColor(mobileColor.accent50, accent50);
    accent100 = Utils.codeToColor(mobileColor.accent100, accent100);
    accent200 = Utils.codeToColor(mobileColor.accent200, accent200);
    accent300 = Utils.codeToColor(mobileColor.accent300, accent300);
    accent400 = Utils.codeToColor(mobileColor.accent400, accent400);
    accent500 = Utils.codeToColor(mobileColor.accent500, accent500);
    accent600 = Utils.codeToColor(mobileColor.accent600, accent600);
    accent700 = Utils.codeToColor(mobileColor.accent700, accent700);
    accent800 = Utils.codeToColor(mobileColor.accent800, accent800);
    accent900 = Utils.codeToColor(mobileColor.accent900, accent900);

    success50 = Utils.codeToColor(mobileColor.success50, success50);
    success100 = Utils.codeToColor(mobileColor.success100, success100);
    success200 = Utils.codeToColor(mobileColor.success200, success200);
    success300 = Utils.codeToColor(mobileColor.success300, success300);
    success400 = Utils.codeToColor(mobileColor.success400, success400);
    success500 = Utils.codeToColor(mobileColor.success500, success500);
    success600 = Utils.codeToColor(mobileColor.success600, success600);
    success700 = Utils.codeToColor(mobileColor.success700, success700);
    success800 = Utils.codeToColor(mobileColor.success800, success800);
    success900 = Utils.codeToColor(mobileColor.success900, success900);

    error50 = Utils.codeToColor(mobileColor.error50, error50);
    error100 = Utils.codeToColor(mobileColor.error100, error100);
    error200 = Utils.codeToColor(mobileColor.error200, error200);
    error300 = Utils.codeToColor(mobileColor.error300, error300);
    error400 = Utils.codeToColor(mobileColor.error400, error400);
    error500 = Utils.codeToColor(mobileColor.error500, error500);
    error600 = Utils.codeToColor(mobileColor.error600, error600);
    error700 = Utils.codeToColor(mobileColor.error700, error700);
    error800 = Utils.codeToColor(mobileColor.error800, error800);
    error900 = Utils.codeToColor(mobileColor.error900, error900);

    warning50 = Utils.codeToColor(mobileColor.warning50, warning50);
    warning100 = Utils.codeToColor(mobileColor.warning100, warning100);
    warning200 = Utils.codeToColor(mobileColor.warning200, warning200);
    warning300 = Utils.codeToColor(mobileColor.warning300, warning300);
    warning400 = Utils.codeToColor(mobileColor.warning400, warning400);
    warning500 = Utils.codeToColor(mobileColor.warning500, warning500);
    warning600 = Utils.codeToColor(mobileColor.warning600, warning600);
    warning700 = Utils.codeToColor(mobileColor.warning700, warning700);
    warning800 = Utils.codeToColor(mobileColor.warning800, warning800);
    warning900 = Utils.codeToColor(mobileColor.warning900, warning900);

    info50 = Utils.codeToColor(mobileColor.info50, info50);
    info100 = Utils.codeToColor(mobileColor.info100, info100);
    info200 = Utils.codeToColor(mobileColor.info200, info200);
    info300 = Utils.codeToColor(mobileColor.info300, info300);
    info400 = Utils.codeToColor(mobileColor.info400, info400);
    info500 = Utils.codeToColor(mobileColor.info500, info500);
    info600 = Utils.codeToColor(mobileColor.info600, info600);
    info700 = Utils.codeToColor(mobileColor.info700, info700);
    info800 = Utils.codeToColor(mobileColor.info800, info800);
    info900 = Utils.codeToColor(mobileColor.info900, info900);

    achromatic50 = Utils.codeToColor(mobileColor.achromatic50, achromatic50);
    achromatic100 = Utils.codeToColor(mobileColor.achromatic100, achromatic100);
    achromatic200 = Utils.codeToColor(mobileColor.achromatic200, achromatic200);
    achromatic300 = Utils.codeToColor(mobileColor.achromatic300, achromatic300);
    achromatic400 = Utils.codeToColor(mobileColor.achromatic400, achromatic400);
    achromatic500 = Utils.codeToColor(mobileColor.achromatic500, achromatic500);
    achromatic600 = Utils.codeToColor(mobileColor.achromatic600, achromatic600);
    achromatic700 = Utils.codeToColor(mobileColor.achromatic700, achromatic700);
    achromatic800 = Utils.codeToColor(mobileColor.achromatic800, achromatic800);
    achromatic900 = Utils.codeToColor(mobileColor.achromatic900, achromatic900);

    facebookColor = Utils.codeToColor(mobileColor.facebookColor, facebookColor);
    googleColor = Utils.codeToColor(mobileColor.googleColor, googleColor);
    phoneColor = Utils.codeToColor(mobileColor.phoneColor, phoneColor);
    appleColor = Utils.codeToColor(mobileColor.appleColor, appleColor);
    paypalColor = Utils.codeToColor(mobileColor.paypalColor, paypalColor);
    stripeColor = Utils.codeToColor(mobileColor.stripeColor, stripeColor);
    razorColor = Utils.codeToColor(mobileColor.razorColor, razorColor);
    paystackColor = Utils.codeToColor(mobileColor.paystackColor, paystackColor);
  }

  /*********************************************To DELETE****************************************************/

  /// Secondary Color
  // static Color secondary50 = cSecondary50;
  // static Color secondary100 = cSecondary100;
  // static Color secondary200 = cSecondary200;
  // static Color secondary300 = cSecondary300;
  // static Color secondary400 = cSecondary400;
  // static Color secondary500 = cSecondary500;
  // static Color secondary600 = cSecondary600;
  // static Color secondary700 = cSecondary700;
  // static Color secondary800 = cSecondary800;
  // static Color secondary900 = cSecondary900;

  // static Color cSecondary50 = const Color(0xFFF9F9F9);
  // static Color cSecondary100 = const Color(0xFFF3F3F3);
  // static Color cSecondary200 = const Color(0xFFEAEAEA);
  // static Color cSecondary300 = const Color(0xFFDADADA);
  // static Color cSecondary400 = const Color(0xFFB7B7B7);
  // static Color cSecondary500 = const Color(0xFF979797);
  // static Color cSecondary600 = const Color(0xFF6F6F6F);
  // static Color cSecondary700 = const Color(0xFF5B5B5B);
  // static Color cSecondary800 = const Color(0xFF3C3C3C);
  // static Color cSecondary900 = const Color(0xFF1C1C1C);
}
