import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import '../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../core/vendor/viewobject/holder/product_detail_and_address_intent_holder.dart';
import '../../../../../config/ps_colors.dart';
import '../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../core/vendor/utils/utils.dart';
import '../../../../custom_ui/checkout/component/billing_address/widgets/billing_address_widget.dart';

class BillingAddressView extends StatelessWidget {
  const BillingAddressView({Key? key, this.productDetailAndAddress})
      : super(key: key);
  final ProductDetailAndAddress? productDetailAndAddress;
  @override
  Widget build(BuildContext context) {
    return PopScope(
      canPop: false,
     onPopInvokedWithResult: (bool didPop, Object? dynamic) async {
        if (!didPop) {
          Navigator.pop(context, '1');
        }
      },
      child: Scaffold(
          appBar: AppBar(
            systemOverlayStyle: SystemUiOverlayStyle(
              statusBarIconBrightness: Utils.getBrightnessForAppBar(context),
            ),
            title: Text('user_add_new_address'.tr,
                style: Theme.of(context).textTheme.titleLarge!.copyWith(
                    color: Utils.isLightMode(context)
                        ? PsColors.achromatic900
                        : PsColors.achromatic50,
                    fontWeight: FontWeight.w500,
                    fontSize: PsDimens.space18)),
          ),
          body: const CustomBillingAddressWidget()),

    );
  }
}
