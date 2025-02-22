import 'package:flutter/material.dart';
import '../../../../config/ps_colors.dart';
import '../../../../core/vendor/provider/language/app_localization_provider.dart';

import '../../../../core/vendor/utils/utils.dart';

class NextButton extends StatelessWidget {
  const NextButton({required this.onTap});
  final Function onTap;
  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.symmetric(horizontal: 16),
      child: MaterialButton(
        height: 40,
        minWidth: double.infinity,
        color: Theme.of(context).primaryColor,
        child: Text(
          'intro_slider_continue'.tr,
          style: Theme.of(context).textTheme.labelLarge?.copyWith(
              color: Utils.isLightMode(context)
                  ? PsColors.achromatic50
                  : PsColors.achromatic800,
              fontWeight: FontWeight.bold),
        ),
        shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(5.0)),
        onPressed: onTap as void Function(),
      ),
    );
  }
}
