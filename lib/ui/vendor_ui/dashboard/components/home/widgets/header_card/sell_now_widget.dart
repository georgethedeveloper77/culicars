import 'package:flutter/material.dart';
import 'package:flutter_svg/svg.dart';
import 'package:fluttericon/font_awesome5_icons.dart';

import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../config/route/route_paths.dart';
import '../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../common/dialog/error_dialog.dart';
import '../../../../../common/ps_button_widget_with_round_corner.dart';

class SellNowWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    // final PsValueHolder psValueHolder = Provider.of<PsValueHolder>(context);
    //  final ItemDetailProvider recentProductProvider = Provider.of<ItemDetailProvider>(context);

    return Container(
      margin: const EdgeInsets.only(
        left: PsDimens.space6,
        right: 4,
      ),
      width: double.infinity,
      // height: 165,
      decoration: BoxDecoration(
        borderRadius: const BorderRadius.all(
          Radius.circular(12.0),
        ),
        border: Border.all(
          color: PsColors.text100,
          width: 1.0,
        ),
        color: Utils.isLightMode(context)
            ? PsColors.achromatic50
            : PsColors.achromatic800,
      ),
      //  margin: const EdgeInsets.only(
      //       left: PsDimens.space6,
      //       top: PsDimens.space8,
      //       right: PsDimens.space6),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: <Widget>[
          const SizedBox(
            height: PsDimens.space8,
          ),
          Row(
            mainAxisAlignment: MainAxisAlignment.spaceBetween,
            children: <Widget>[
              Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: <Widget>[
                  Padding(
                    padding: const EdgeInsets.only(
                        left: PsDimens.space8,
                        right: PsDimens.space8,
                        top: PsDimens.space8),
                    child: Text(
                      'header_card_title'.tr,
                      textAlign: TextAlign.right,
                      style: Theme.of(context)
                          .textTheme
                          .titleLarge!
                          .copyWith(color: PsColors.text900),
                    ),
                  ),
                  Container(
                    padding: const EdgeInsets.only(
                        left: PsDimens.space8,
                        right: PsDimens.space8,
                        top: PsDimens.space8),
                    width: PsDimens.space220,
                    child: Text(
                      'header_card_description'.tr,
                      //'Upload your car to our mobile app and \n reach potential buyers looking to \n purchase a car'.tr,
                      // textAlign: TextAlign.right,
                      overflow: TextOverflow.ellipsis,
                      maxLines: 3,
                      style: Theme.of(context)
                          .textTheme
                          .bodySmall!
                          .copyWith(color: PsColors.text400),
                    ),
                  ),
                ],
              ),
              Expanded(
                child: SvgPicture.asset(
                  'assets/images/slider_2.svg',
                  width: 108,
                  height: 90,
                ),
              ),
            ],
          ),
          Padding(
            padding: const EdgeInsets.only(
                bottom: PsDimens.space12,
                left: PsDimens.space12,
                right: PsDimens.space12,
                top: PsDimens.space16),
            child: PSButtonWidgetWithIconRoundCorner(
              colorData: Theme.of(context).primaryColor,
              hasShadow: false,
              //width: double.infinity,
              titleText: 'sell_your_vehicle'.tr,
              icon: FontAwesome5.car_alt,
              onPressed: () async {
                if (await Utils.checkInternetConnectivity()) {
                  Utils.navigateOnUserVerificationView(context, () async {
                    await Navigator.pushNamed(
                        context, RoutePaths.entryCategoryList,
                        arguments: true);
                  });
                } else {
                  showDialog<dynamic>(
                      context: context,
                      builder: (BuildContext context) {
                        return ErrorDialog(
                          message: 'error_dialog__no_internet'.tr,
                        );
                      });
                }
              },
            ),
          ),
        ],
      ),
    );
  }
}
