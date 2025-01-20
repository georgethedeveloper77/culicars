import 'package:flutter/material.dart';
import 'package:flutterwave_standard_smart/flutterwave.dart';
import 'package:provider/provider.dart';
import '../../../../../../../../config/ps_colors.dart';
import '../../../../../../../../config/ps_config.dart';
import '../../../../../../../../core/vendor/api/common/ps_resource.dart';
import '../../../../../../../../core/vendor/constant/ps_constants.dart';
import '../../../../../../../../core/vendor/constant/ps_dimens.dart';
import '../../../../../../../../core/vendor/provider/app_info/app_info_provider.dart';
import '../../../../../../../../core/vendor/provider/language/app_localization_provider.dart';
import '../../../../../../../../core/vendor/provider/promotion/item_promotion_provider.dart';
import '../../../../../../../../core/vendor/provider/user/user_provider.dart';
import '../../../../../../../../core/vendor/utils/utils.dart';
import '../../../../../../../../core/vendor/viewobject/common/ps_value_holder.dart';
import '../../../../../../../../core/vendor/viewobject/holder/item_paid_history_parameter_holder.dart';
import '../../../../../../../../core/vendor/viewobject/holder/request_path_holder.dart';
import '../../../../../../../../core/vendor/viewobject/item_paid_history.dart';
import '../../../../../../../../core/vendor/viewobject/product.dart';
import '../../../../../../common/dialog/check_item_dialog.dart';
import '../../../../../../common/dialog/error_dialog.dart';
import '../../../../../../common/dialog/success_dialog.dart';
import 'demo_warning_dialog.dart';

class FlutterwaveButton extends StatelessWidget {
  const FlutterwaveButton({
    //required this.getEnterDateCountController,
    required this.product,
    required this.amount,
    required this.howManyDay,
    required this.selectedDate,
    required this.selectedTime,
    required this.provider,
    required this.appProvider,
    required this.userProvider,
  });
  // final TextEditingController getEnterDateCountController;
  final Product product;
  final String howManyDay;
  final String amount;
  final String selectedDate;
  final DateTime selectedTime;
  final ItemPromotionProvider? provider;
  final AppInfoProvider? appProvider;
  final UserProvider? userProvider;

  @override
  Widget build(BuildContext context) {
    String? chooseDay;
    chooseDay = howManyDay;

    String? startDate;
    startDate = selectedDate;

    DateTime? time;
    time = selectedTime;

    return Container(
      margin: const EdgeInsets.only(
          top: PsDimens.space8,
          left: PsDimens.space16,
          right: PsDimens.space16),
      width: double.infinity,
      child: InkWell(
        onTap: () async {
          final PsValueHolder psValueHolder =
              Provider.of<PsValueHolder>(context, listen: false);

          if (double.parse(amount) <= 0) {
            return;
          }
          print('Payapl amount :::::::::::::::' + amount);

          if (psValueHolder.isDemoForPayment!) {
            await callDemoWarningDialog(context);
          }

          final int reultStartTimeStamp =
              Utils.getTimeStampDividedByOneThousand(time!);

          final Flutterwave flutterwave = Flutterwave(
              context: context,
              publicKey: psValueHolder.flutterwavePublicKey!,
              currency: appProvider!.appInfo.data!.currencyShortForm!,
              redirectUrl: PsConfig.ps_app_url,
              txRef: '${DateTime.now().microsecond}',
              amount: amount,
              customer: Customer(
                  name: userProvider?.user.data?.name ?? '',
                  phoneNumber: userProvider?.user.data?.userPhone ?? '',
                  email: userProvider?.user.data?.userEmail ?? ''),
              paymentOptions: 'card, payattitude, barter, bank transfer, ussd',
              customization: Customization(title: 'app_name'.tr),
              isTestMode: true);

          final ChargeResponse response = await flutterwave.charge();

          print(response);

          if (response.status == 'success' || response.status == 'successful') {
            final ItemPaidHistoryParameterHolder
                itemPaidHistoryParameterHolder = ItemPaidHistoryParameterHolder(
                    itemId: product.id,
                    amount: amount,
                    howManyDay: chooseDay,
                    paymentMethod: PsConst.PAYMENT_FLUTTERWAVE_METHOD,
                    paymentMethodNounce: '',
                    startDate: startDate,
                    startTimeStamp: reultStartTimeStamp.toString(),
                    razorId: '',
                    purchasedId: '',
                    isPaystack: PsConst.ZERO,
                    inAppPurchasedProductId: '');

            final PsValueHolder psValueHolder =
                Provider.of<PsValueHolder>(context, listen: false);

            final PsResource<ItemPaidHistory> paidHistoryData = await provider!
                .postData(
                    requestPathHolder: RequestPathHolder(
                        loginUserId: Utils.checkUserLoginId(psValueHolder)),
                    requestBodyHolder: itemPaidHistoryParameterHolder);

            if (paidHistoryData.data != null) {
              showDialog<dynamic>(
                  context: context,
                  builder: (BuildContext contet) {
                    return SuccessDialog(
                      message: 'item_promote__success'.tr,
                      onPressed: () {
                        Navigator.of(context).pop(true);
                        Navigator.of(context).pop(true);
                      },
                    );
                  });
            } else {
              showDialog<dynamic>(
                  context: context,
                  builder: (BuildContext context) {
                    return ErrorDialog(
                      message: paidHistoryData.message,
                    );
                  });
            }
          } else {
            showDialog<dynamic>(
                context: context,
                builder: (BuildContext context) {
                  return CheckOutDialog(
                    title: 'checkout__payment_fail'.tr,
                    message: response.txRef,
                  );
                });
          }

          // ignore: unnecessary_null_comparison
        },
        child: Row(
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          crossAxisAlignment: CrossAxisAlignment.center,
          children: <Widget>[
            Row(
              children: <Widget>[
                Column(
                  children: <Widget>[
                    Container(
                        width: 62,
                        height: 62,
                        child: Image.asset(
                          'assets/images/payment/flutterwave.png',
                          fit: BoxFit.fill,
                        )),
                    const SizedBox(
                      height: 2,
                    )
                  ],
                ),
                const SizedBox(width: PsDimens.space16),
                Text(
                  'item_promote__flutterwave'.tr,
                  style: Theme.of(context).textTheme.titleMedium?.copyWith(
                      color: Utils.isLightMode(context)
                          ? PsColors.achromatic800
                          : PsColors.achromatic50),
                ),
              ],
            ),
            Icon(
              Icons.chevron_right,
              color: Utils.isLightMode(context)
                  ? PsColors.achromatic800
                  : PsColors.achromatic50,
            )
          ],
        ),
      ),
    );
  }
}
