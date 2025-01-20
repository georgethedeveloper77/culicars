import 'package:flutter/material.dart';

import '../../../../config/ps_colors.dart';
import '../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../core/vendor/utils/utils.dart';

class Description extends StatelessWidget {
  const Description({required this.currentIndex});
  final int currentIndex;
  @override
  Widget build(BuildContext context) {
    final List<String> descriptionList = <String>[
      'intro_slider1_description',
      'intro_slider2_description',
      'intro_slider3_description'
    ];
    return Container(
      height: 50,
      alignment: Alignment.centerLeft,
      margin: const EdgeInsets.only(
          top: PsDimens.space4,
          left: PsDimens.space16,
          right: PsDimens.space16),
      // padding: const EdgeInsets.symmetric(horizontal: PsDimens.space16),
      child: Text(
        descriptionList[currentIndex].tr,
        style: Theme.of(context).textTheme.bodySmall?.copyWith(
            color: Utils.isLightMode(context)
                ? PsColors.primary600
                : PsColors.achromatic50,
            fontSize: 16),
        textAlign: TextAlign.start,
      ),
    );
  }
}
