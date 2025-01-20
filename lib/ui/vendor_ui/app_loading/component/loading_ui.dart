import 'package:flutter/material.dart';
import 'package:lottie/lottie.dart';

import '../../../../config/ps_colors.dart';
import '../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../core/vendor/utils/utils.dart';
import '../../common/ps_square_progress_widget.dart';

class LoadingUi extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final Widget _imageWidget = Container(
      width: 200,
      height: 100,
      child: Lottie.asset('assets/images/car.json'),
    );
    return Container(
        height: 400,
        color: Utils.isLightMode(context)
            ? PsColors.achromatic50
            : PsColors.achromatic800,
        child: Row(
          mainAxisAlignment: MainAxisAlignment.center,
          children: <Widget>[
            Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: <Widget>[
                _imageWidget,
                Text('app_name'.tr,
                    style: Theme.of(context).textTheme.titleLarge!.copyWith(
                          fontWeight: FontWeight.bold,
                          color: Utils.isLightMode(context)
                              ? PsColors.achromatic700
                              : PsColors.achromatic50,
                        )),
                const SizedBox(
                  height: PsDimens.space8,
                ),
                Container(
                    padding: const EdgeInsets.all(PsDimens.space16),
                    child: PsSquareProgressWidget()),
              ],
            )
          ],
        ));
  }
}
