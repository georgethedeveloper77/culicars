import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../../../../../../config/ps_colors.dart';
import '../../../../../../../core/vendor/utils/utils.dart';

import '../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../core/vendor/provider/product/product_provider.dart';
import '../../../../../../core/vendor/viewobject/product.dart';

class PaidAdStatusWidget extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final ItemDetailProvider provider =
        Provider.of<ItemDetailProvider>(context);
    final Product product = provider.product;

    String? status = '';
    Color? boxColor;
    if (product.isPaidAdInProgress) {
      status = 'paid__ads_in_progress'.tr;
      boxColor = PsColors.info500;
    } else if (product.isPaidAdInReject) {
      status = 'paid__ads_in_rejected'.tr;
      boxColor = PsColors.error500;
    } else if (product.isAdWaitingForApproval) {
      status = 'paid__ads_waiting'.tr;
      boxColor = PsColors.warning500;
    } else if (product.isPaidAdInFinish) {
      status = 'paid__ads_in_completed'.tr;
      boxColor = PsColors.achromatic900;
    } else if (product.isPaidAdNotYetStart) {
      status = 'paid__ads_is_not_yet_start'.tr;
      boxColor = PsColors.warning500;
    }

    /**UI Section is here */
    return Container(
      margin: const EdgeInsets.only(right: PsDimens.space16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.end,
        children: <Widget>[
          if (product.isSoldOutItem)
            Container(
              margin: const EdgeInsets.only(
                  top: PsDimens.space6,
                  right: PsDimens.space6,
                  left: PsDimens.space6),
              decoration: BoxDecoration(
                  borderRadius: BorderRadius.circular(PsDimens.space4),
                  color: Theme.of(context).primaryColor),
              padding: const EdgeInsets.only(
                  bottom: PsDimens.space6,
                  top: PsDimens.space4,
                  right: PsDimens.space8,
                  left: PsDimens.space8),
              child: Text(
                'dashboard__sold_out'.tr,
                style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                    color: Utils.isLightMode(context)
                        ? PsColors.achromatic50
                        : PsColors.achromatic900,
                    fontWeight: FontWeight.w500,
                    height: 1.5),
              ),
            ),
          Container(
            margin: const EdgeInsets.only(
                bottom: PsDimens.space6,
                top: PsDimens.space6,
                right: PsDimens.space6,
                left: PsDimens.space6),
            decoration: BoxDecoration(
                borderRadius: BorderRadius.circular(PsDimens.space4),
                color: boxColor),
            padding: const EdgeInsets.only(
                bottom: PsDimens.space6,
                top: PsDimens.space4,
                right: PsDimens.space8,
                left: PsDimens.space8),
            child: Text(
              status,
              style: Theme.of(context).textTheme.bodyLarge!.copyWith(
                  color: PsColors.achromatic50,
                  fontWeight: FontWeight.w500,
                  height: 1.5),
            ),
          ),
        ],
      ),
    );
  }
}
