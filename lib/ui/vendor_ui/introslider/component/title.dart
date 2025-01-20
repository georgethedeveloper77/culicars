import 'package:flutter/material.dart';

import '../../../../config/ps_colors.dart';
import '../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../core/vendor/utils/utils.dart';

class SliderTitle extends StatelessWidget {
  const SliderTitle({required this.currentIndex});
  final int currentIndex;
  @override
  Widget build(BuildContext context) {
    final List<String> titleList = <String>[
      'intro_slider1_title',
      'intro_slider2_title',
      'intro_slider3_title'
    ];
    return Container(
        margin: const EdgeInsets.only(
            top: PsDimens.space24,
            left: PsDimens.space16,
            right: PsDimens.space16),
        child: Text(
          titleList[currentIndex].tr,
          style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              color: Utils.isLightMode(context)
                  ? PsColors.primary800
                  : PsColors.achromatic50,
              fontWeight: FontWeight.w700,
              fontSize: 28),
          textAlign: TextAlign.start,
        ));
  }
}
